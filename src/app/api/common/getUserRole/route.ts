import pool from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {

    const { rows } = await pool.query(
        'SELECT role_code ,role_name FROM "OOMiddleware"."User_Role" order by role_code asc',
    );
    return NextResponse.json(rows);
}
