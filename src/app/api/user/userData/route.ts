import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    
    const res = await pool.query('SELECT * FROM  "OOMiddleware"."Users" ORDER BY user_code ASC');

    return NextResponse.json(res.rows);
  } catch (error) {
    console.error('Error fetching Users:', error);
    return NextResponse.json({ error: 'Failed to fetch store' }, { status: 500 });
  }
}
