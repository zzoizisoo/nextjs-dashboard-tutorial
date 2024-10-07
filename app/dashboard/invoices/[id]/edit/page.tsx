import Form from '@/app/ui/invoices/edit-form';
import Breadcrumbs from '@/app/ui/invoices/breadcrumbs';
import { fetchInvoiceById, fetchCustomers } from '@/app/lib/data';
import { notFound } from 'next/navigation';
 
export default async function Page({params}:{ params: {id: string}}) {
    const _id= params.id
    const [invoice, customers] = await Promise.all([
        fetchInvoiceById(_id),
        fetchCustomers()
    ])
    if(Object.keys(invoice).length===0) {
        notFound();
    }
  return (
    <main>
      <Breadcrumbs
        breadcrumbs={[
          { label: 'Invoices', href: '/dashboard/invoices' },
          {
            label: 'Edit Invoice',
            href: `/dashboard/invoices/${_id}/edit`,
            active: true,
          },
        ]}
      />
      <Form invoice={JSON.stringify(invoice)} customers={JSON.stringify(customers)} />
    </main>
  );
}