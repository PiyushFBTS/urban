import { NextResponse } from 'next/server'
import pool from '@/lib/db'

export async function GET(req: Request) {
  try {
    // 1. Fetch all orders from Order_Header
    const headerQuery = `
      SELECT order_id, order_channel, order_unique_id, customer_phone, customer_email, customer_name,
        order_total_tax, order_payable_amount, order_total, order_type, order_discount, order_delivery_datetime,
        order_status, order_instructions, order_total_charges, order_created, order_subtotal, order_payment_amount,
        order_store, order_store_merchant_ref_id, order_table_no, created_date_time, order_ext_platform_id,
        order_discount_id, order_discount_code, order_is_instant_order, order_otp, customer_app_uid,
        order_expected_pickup_time
      FROM "OOMiddleware"."Order_Header"
    `
    const { rows: headerRows } = await pool.query(headerQuery)

    // 2. Fetch all order line items
    const lineQuery = `
      SELECT order_id, line_no, parent_line_no, item_merchant_id, item_name, item_quantity, item_price,
        item_discount, item_total, item_total_with_tax, items_options_to_add_group_is_variant, item_instructions,
        cgst_rate, cgst_amount, sgst_rate, sgst_amount, items_redeem_subscription_voucher_code
      FROM "OOMiddleware".order_line
    `
    const { rows: itemRows } = await pool.query(lineQuery)

    // 3. Group line items by order_id
    const itemMap: Record<string, any[]> = {}
    for (const item of itemRows) {
      if (!itemMap[item.order_id]) itemMap[item.order_id] = []

      itemMap[item.order_id].push({
        instructions: item.item_instructions || '',
        quantity: item.item_quantity,
        total_with_tax: item.item_total_with_tax || 0,
        'line no': item.line_no,
        subscription_voucher_code: item.items_redeem_subscription_voucher_code || '',
        discount: parseFloat(item.item_discount),
        taxes: {
          cgst_rate: parseFloat(item.cgst_rate),
          cgst_value: parseFloat(item.cgst_amount),
          sgst_value: parseFloat(item.sgst_amount),
          sgst_rate: parseFloat(item.sgst_rate),
        },
        title: item.item_name,
        total: parseFloat(item.item_total),
        'parent line no': item.parent_line_no,
        price: parseFloat(item.item_price),
        merchant_ref_no: item.item_merchant_id,
        is_variant: item.items_options_to_add_group_is_variant
      })
    }

    // 4. Format the response with order details + corresponding items
    const response = headerRows.map((header: any) => ({
      order_details_delivery_datetime: header.order_delivery_datetime || '0',
      order_details_order_subtotal: header.order_subtotal || '0.00',
      order_payment_amount: header.order_payment_amount || '0.00',
      order_details_id: header.order_id,
      customer_phone: header.customer_phone,
      customer_app_user_id: header.customer_app_uid,
      order_details_total_charges: header.order_total_charges || '0.00',
      order_details_order_total: header.order_total || '0.00',
      order_store_name: header.order_store,
      order_details_created: header.order_created,
      order_store_merchant_ref_id: header.order_store_merchant_ref_id,
      order_details_total_taxes: header.order_total_tax || '0.00',
      order_details_order_level_total_taxes: header.order_total_tax || '0.00',
      order_details_discount: header.order_discount || '0.00',
      order_details_order_state: header.order_status,
      order_details_tableno: header.order_table_no || '',
      order_details_ext_platforms_id: header.order_ext_platform_id,
      customer_email: header.customer_email,
      order_details_channel: header.order_channel,
      order_details_order_type: header.order_type,
      customer_name: header.customer_name,
      order_details_expected_pickup_time: header.order_expected_pickup_time,
      items: itemMap[header.order_id] || [],
      order_details_payable_amount: header.order_payable_amount,
      order_details_instructions: header.order_instructions || '',
      order_details_discount_id: header.order_discount_id,
      order_details_discount_code: header.order_discount_code,
      order_details_ext_platforms_is_instant_order: header.order_is_instant_order,
      order_details_ext_platforms_order_otp: header.order_otp
    }))

    return NextResponse.json(response, { status: 200 })

  } catch (err: any) {
    console.error(err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
