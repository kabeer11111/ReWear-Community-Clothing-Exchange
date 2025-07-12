-- Ensure RLS is enabled for all relevant tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.swaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.points_transactions ENABLE ROW LEVEL SECURITY;

-- Re-create the is_admin_user function to ensure it's up-to-date and SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- RLS Policies for public.users
-- Drop existing policies to ensure clean application
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Authenticated users can view public user info" ON public.users;
-- If the user had "Anyone can view public user info" and it was too broad, this will remove it.
DROP POLICY IF EXISTS "Anyone can view public user info" ON public.users;


-- Policy 1: Users can view their own profile (full access to their own row)
CREATE POLICY "Users can view their own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

-- Policy 2: Admins can view all users (full access to all rows for admins)
CREATE POLICY "Admins can view all users" ON public.users
  FOR SELECT USING (public.is_admin_user());

-- Policy 3: Authenticated users can view basic public info of other users (e.g., for item listings)
-- This policy allows any authenticated user to SELECT rows from public.users.
-- The application layer should ensure only non-sensitive fields like full_name and avatar_url are displayed.
CREATE POLICY "Authenticated users can view public user info" ON public.users
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Policy for users to update their own profile
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
CREATE POLICY "Users can update their own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Policy for admins to update any user role
DROP POLICY IF EXISTS "Admins can update any user role" ON public.users;
CREATE POLICY "Admins can update any user role" ON public.users
  FOR UPDATE USING (
    public.is_admin_user()
  );

-- Policy for admins to delete any user
DROP POLICY IF EXISTS "Admins can delete any user" ON public.users;
CREATE POLICY "Admins can delete any user" ON public.users
  FOR DELETE USING (
    public.is_admin_user()
  );


-- RLS Policies for public.items
-- Drop existing policies to ensure clean application
DROP POLICY IF EXISTS "Anyone can view approved items" ON public.items;
DROP POLICY IF EXISTS "Users can insert their own items" ON public.items;
DROP POLICY IF EXISTS "Users can update their own items" ON public.items;
DROP POLICY IF EXISTS "Admins can update any item" ON public.items;
DROP POLICY IF EXISTS "Admins can delete any item" ON public.items;
DROP POLICY IF EXISTS "Admins can view all items" ON public.items; -- New policy, ensure it's dropped if it existed


-- Policy 1: Anyone can view approved items (and owners can view their own regardless of status)
CREATE POLICY "Anyone can view approved items" ON public.items
  FOR SELECT USING (status = 'approved' OR user_id = auth.uid());

-- Policy 2: Admins can view all items (for admin panel)
CREATE POLICY "Admins can view all items" ON public.items
  FOR SELECT USING (public.is_admin_user());

-- Policy 3: Users can insert their own items
CREATE POLICY "Users can insert their own items" ON public.items
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy 4: Users can update their own items
CREATE POLICY "Users can update their own items" ON public.items
  FOR UPDATE USING (auth.uid() = user_id);

-- Policy 5: Admins can update any item
CREATE POLICY "Admins can update any item" ON public.items
  FOR UPDATE USING (
    public.is_admin_user()
  );

-- Policy 6: Admins can delete any item
CREATE POLICY "Admins can delete any item" ON public.items
  FOR DELETE USING (
    public.is_admin_user()
  );


-- RLS Policies for public.swaps
-- Drop existing policies to ensure clean application
DROP POLICY IF EXISTS "Users can view their own swaps" ON public.swaps;
DROP POLICY IF EXISTS "Users can create swaps" ON public.swaps;
DROP POLICY IF EXISTS "Users can update swaps they're involved in" ON public.swaps;

-- Policy 1: Users can view their own swaps
CREATE POLICY "Users can view their own swaps" ON public.swaps
  FOR SELECT USING (auth.uid() = requester_id OR auth.uid() = owner_id);

-- Policy 2: Users can create swaps
CREATE POLICY "Users can create swaps" ON public.swaps
  FOR INSERT WITH CHECK (auth.uid() = requester_id);

-- Policy 3: Users can update swaps they're involved in
CREATE POLICY "Users can update swaps they're involved in" ON public.swaps
  FOR UPDATE USING (auth.uid() = requester_id OR auth.uid() = owner_id);


-- RLS Policies for public.points_transactions
-- Drop existing policies to ensure clean application
DROP POLICY IF EXISTS "Users can view their own transactions" ON public.points_transactions;

-- Policy 1: Users can view their own transactions
CREATE POLICY "Users can view their own transactions" ON public.points_transactions
  FOR SELECT USING (auth.uid() = user_id);

-- Functions (ensure they are up-to-date)
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
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
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
