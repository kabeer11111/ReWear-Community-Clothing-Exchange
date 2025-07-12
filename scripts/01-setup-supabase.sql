-- Enable Row Level Security
ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret';

-- Create custom types
CREATE TYPE item_condition AS ENUM ('new', 'like_new', 'good', 'fair', 'poor');
CREATE TYPE item_status AS ENUM ('pending', 'approved', 'rejected', 'swapped');
CREATE TYPE swap_status AS ENUM ('pending', 'accepted', 'rejected', 'completed');
CREATE TYPE user_role AS ENUM ('user', 'admin');

-- Users table (extends Supabase auth.users)
CREATE TABLE public.users (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  points INTEGER DEFAULT 100,
  role user_role DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Items table
CREATE TABLE public.items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  type TEXT NOT NULL,
  size TEXT NOT NULL,
  condition item_condition NOT NULL,
  tags TEXT[],
  images TEXT[],
  points_value INTEGER DEFAULT 10,
  status item_status DEFAULT 'pending',
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Swaps table
CREATE TABLE public.swaps (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  requester_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  owner_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  item_id UUID REFERENCES public.items(id) ON DELETE CASCADE NOT NULL,
  offered_item_id UUID REFERENCES public.items(id) ON DELETE CASCADE,
  points_offered INTEGER DEFAULT 0,
  status swap_status DEFAULT 'pending',
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Points transactions table
CREATE TABLE public.points_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  amount INTEGER NOT NULL,
  type TEXT NOT NULL, -- 'earned', 'spent', 'bonus'
  description TEXT,
  related_swap_id UUID REFERENCES public.swaps(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.swaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.points_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users
CREATE POLICY "Users can view their own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Anyone can view public user info" ON public.users
  FOR SELECT USING (true);

-- RLS Policies for items
CREATE POLICY "Anyone can view approved items" ON public.items
  FOR SELECT USING (status = 'approved' OR user_id = auth.uid());

CREATE POLICY "Users can insert their own items" ON public.items
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own items" ON public.items
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all items" ON public.items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update any item" ON public.items
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for swaps
CREATE POLICY "Users can view their own swaps" ON public.swaps
  FOR SELECT USING (auth.uid() = requester_id OR auth.uid() = owner_id);

CREATE POLICY "Users can create swaps" ON public.swaps
  FOR INSERT WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Users can update swaps they're involved in" ON public.swaps
  FOR UPDATE USING (auth.uid() = requester_id OR auth.uid() = owner_id);

-- RLS Policies for points transactions
CREATE POLICY "Users can view their own transactions" ON public.points_transactions
  FOR SELECT USING (auth.uid() = user_id);

-- Functions
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update points
CREATE OR REPLACE FUNCTION public.update_user_points(
  user_id UUID,
  amount INTEGER,
  transaction_type TEXT,
  description TEXT DEFAULT NULL,
  swap_id UUID DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  -- Update user points
  UPDATE public.users 
  SET points = points + amount,
      updated_at = NOW()
  WHERE id = user_id;
  
  -- Record transaction
  INSERT INTO public.points_transactions (user_id, amount, type, description, related_swap_id)
  VALUES (user_id, amount, transaction_type, description, swap_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to send email notifications (you'll need to set up email templates in Supabase)
CREATE OR REPLACE FUNCTION public.notify_item_status_change()
RETURNS TRIGGER AS $$
DECLARE
  user_email TEXT;
  user_name TEXT;
  email_subject TEXT;
  email_body TEXT;
BEGIN
  -- Get user details
  SELECT email, full_name INTO user_email, user_name
  FROM auth.users au
  JOIN public.users pu ON au.id = pu.id
  WHERE pu.id = NEW.user_id;

  -- Set email content based on status
  IF NEW.status = 'approved' THEN
    email_subject := 'Your item has been approved!';
    email_body := 'Congratulations! Your item "' || NEW.title || '" has been approved and is now visible to the community.';
  ELSIF NEW.status = 'rejected' THEN
    email_subject := 'Your item needs attention';
    email_body := 'Your item "' || NEW.title || '" was not approved. Please review our guidelines and try again.';
  END IF;

  -- Send email (requires Supabase Edge Functions or external service)
  -- This is a placeholder - you'll implement the actual email sending
  INSERT INTO public.email_queue (to_email, subject, body, created_at)
  VALUES (user_email, email_subject, email_body, NOW());

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Email queue table for notifications
CREATE TABLE public.email_queue (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  to_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  sent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trigger for item status changes
CREATE TRIGGER on_item_status_change
  AFTER UPDATE OF status ON public.items
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION public.notify_item_status_change();

-- Create admin user function (run this after creating your account)
CREATE OR REPLACE FUNCTION public.make_admin(user_email TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE public.users 
  SET role = 'admin'
  WHERE email = user_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
