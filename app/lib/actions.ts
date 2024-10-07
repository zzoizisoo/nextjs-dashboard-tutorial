'use server'

import {z} from 'zod'
import clientPromise from './mongodb';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { ObjectId } from 'mongodb';

const FormSchema = z.object({
    id: z.string(), //_id, ObjectId type 아닌가? 🤔 ...
    customer_id: z.string(),
    amount: z.coerce.number(),
    status: z.enum(['pending', 'paid']),
    date: z.string(),
  });

const CreateInvoice = FormSchema.omit({ id: true, date: true });
export async function createInvoice(formData: FormData){ 
    console.log('formData:', formData)

    const {customer_id, amount, status} = CreateInvoice.parse({
        customer_id: formData.get('customer_id'),
        amount: formData.get('amount'),
        status: formData.get('status'),
      });
      // Test it out:
    //   console.log(rawFormData);
    const amountInCents = amount * 100;
    const date = new Date().toISOString().split('T')[0];
    
    const client = await clientPromise;
    const collection = client.db("nextjs-dashboard-tutorial").collection("invoices")
    await collection.insertOne({customer_id: new ObjectId(customer_id), amount: amountInCents, status, date})

    revalidatePath('/dashboard/invoices')
    redirect('/dashboard/invoices')
}


const UpdateInvoice = FormSchema.omit({id: true, date: true})
export async function updateInvoice(id:string, formData: FormData) {
    const { customer_id, amount, status } = UpdateInvoice.parse({
        customer_id: formData.get('customer_id'),
        amount: formData.get('amount'),
        status: formData.get('status'),
      });

      const amountInCents = amount * 100;

      const client = await clientPromise;
      const collection = client.db("nextjs-dashboard-tutorial").collection("invoices")
      collection.updateOne({_id: new ObjectId(id)},
      {
        $set:{
        customer_id: new ObjectId(customer_id),
        amount: amountInCents,
        status: status}
      })

      revalidatePath('/dashboard/invoices');
      redirect('/dashboard/invoices');
}

export async function deleteInvoice(id: string){ 
    const client = await clientPromise;
    const collection = client.db("nextjs-dashboard-tutorial").collection("invoices")

    collection.deleteOne({_id: new ObjectId(id)})
    revalidatePath('/dashboard/invoices');
}