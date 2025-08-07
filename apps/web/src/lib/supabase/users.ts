import { createClient } from '@/utils/supabase/server';
import { createHash } from 'crypto';

export interface User {
  id: string;
  address: string;
  name: string;
  created_at?: string;
  updated_at?: string;
}

export async function findOrCreateUser(address: string): Promise<User | null> {
  const supabase = createClient();
  
  // Generate consistent user ID from address
  const userId = createHash('sha256').update(address).digest('hex');
  const displayName = `${address.slice(0, 4)}...${address.slice(-4)}`;
  
  try {
    // First, try to find existing user
    const { data: existingUser, error: findError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (existingUser) {
      return existingUser;
    }
    
    // If not found, create new user
    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert({
        id: userId,
        address,
        name: displayName
      })
      .select()
      .single();
    
    if (createError) {
      console.error('Error creating user:', createError);
      return null;
    }
    
    // Also create default user preferences
    await supabase
      .from('user_preferences')
      .insert({
        user_id: userId
      });
    
    return newUser;
  } catch (error) {
    console.error('Error in findOrCreateUser:', error);
    return null;
  }
}

export async function getUserById(userId: string): Promise<User | null> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();
  
  if (error) {
    console.error('Error fetching user:', error);
    return null;
  }
  
  return data;
}