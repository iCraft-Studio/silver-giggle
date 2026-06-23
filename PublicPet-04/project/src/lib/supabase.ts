import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ============================================================================
// 1. DATABASE INTERFACES (Mapped exactly to our SQL Schema)
// ============================================================================

export interface Profile {
  id: string; // Matches auth.users ID
  role: 'customer' | 'admin';
  username: string;
  full_name?: string;
  phone_number?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Collection {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image_url?: string;
  created_at?: string;
}

export interface ShowcaseItem {
  id: string;
  collection_id?: string;
  title: string;
  slug: string;
  description?: string;
  material?: string;
  price: number;
  stock_quantity: number;
  image_urls: string[];
  is_featured?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Order {
  id?: string;
  user_id?: string; // Null if guest
  guest_email?: string;
  status: 'pending' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  total_amount: number;
  paystack_reference?: string;
  shipping_address: any; // Stored as JSONB in DB
  created_at?: string;
}

export interface OrderItem {
  id?: string;
  order_id: string;
  item_id: string;
  quantity: number;
  price_at_time: number;
  created_at?: string;
}

// ============================================================================
// 2. AUTHENTICATION FUNCTIONS
// ============================================================================

export const signUpUser = async (email: string, password: string, username: string, fullName?: string, phone?: string) => {
  // We just pass the metadata. The SQL Trigger we wrote handles inserting it into the `profiles` table automatically!
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        username: username,
        full_name: fullName || '',
        phone_number: phone || '',
      }
    }
  });

  if (authError) throw authError;
  return authData;
};

export const signInUser = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) throw error;
  
  // Fetch user profile to get their role (admin vs customer)
  const { data: userProfile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', data.user.id)
    .single();

  if (profileError) {
    console.error('Error fetching user profile:', profileError);
  }

  // Return combined user auth data and their profile data
  return { auth: data.user, profile: userProfile };
};

export const signOutUser = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

// ============================================================================
// 3. E-COMMERCE HELPER FUNCTIONS
// ============================================================================

export const getCollections = async () => {
  const { data, error } = await supabase
    .from('collections')
    .select('*')
    .order('created_at', { ascending: true });
  
  if (error) throw error;
  return data as Collection[];
};

export const getShowcaseItems = async (categorySlug?: string) => {
  let query = supabase
    .from('showcase_items')
    .select('*, collections!inner(slug)');

  if (categorySlug) {
    query = query.eq('collections.slug', categorySlug);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
};

export const getProductDetails = async (productSlug: string) => {
  const { data, error } = await supabase
    .from('showcase_items')
    .select('*, collections!inner(slug, name)')
    .eq('slug', productSlug)
    .single();
    
  if (error) throw error;
  return data;
};

// ============================================================================
// 4. CHECKOUT / ORDER FUNCTIONS
// ============================================================================

export const createOrder = async (orderData: Order, items: Omit<OrderItem, 'id' | 'order_id' | 'created_at'>[]) => {
  // 1. Insert the main order
  const { data: newOrder, error: orderError } = await supabase
    .from('orders')
    .insert([orderData])
    .select('id')
    .single();

  if (orderError) throw orderError;

  // 2. Map the items to include the newly generated order_id
  const orderItemsData = items.map(item => ({
    ...item,
    order_id: newOrder.id
  }));

  // 3. Insert all items into the order_items table
  const { error: itemsError } = await supabase
    .from('order_items')
    .insert(orderItemsData);

  if (itemsError) throw itemsError;

  return newOrder;
};