"use server";

import { z } from "zod";
import clientPromise from "./mongodb";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ObjectId } from "mongodb";

const FormSchema = z.object({
	id: z.string(), //_id, ObjectId type 아닌가? 🤔 ...
	customer_id: z.string({
		invalid_type_error: "Please select a customer",
	}),
	amount: z.coerce
		.number()
		.gt(0, { message: "Please enter an amount greater than $0" }),
	status: z.enum(["pending", "paid"], {
		invalid_type_error: "Please select an invoice status",
	}),
	date: z.string(),
});

export type State = {
	errors?: {
		customerId?: string[];
		amount?: string[];
		status?: string[];
	};
	message?: string | null;
};

const CreateInvoice = FormSchema.omit({ id: true, date: true });
export async function createInvoice(prevState: State, formData: FormData) {
	const validatedFields = CreateInvoice.safeParse({
		customer_id: formData.get("customer_id"),
		amount: formData.get("amount"),
		status: formData.get("status"),
	});
	if (!validatedFields.success) {
		return {
			errors: validatedFields.error.flatten().fieldErrors,
			message: "Missing Fields. Failed to Create Invoice.",
		};
	}

	const { customer_id, amount, status } = validatedFields.data;
	const amountInCents = amount * 100;
	const date = new Date().toISOString().split("T")[0];
    try {
		const client = await clientPromise;
		const collection = client
			.db("nextjs-dashboard-tutorial")
			.collection("invoices");
		await collection.insertOne({
			customer_id: new ObjectId(customer_id),
			amount: amountInCents,
			status,
			date,
		});
	} catch (e) {
		return {
			message: "Database Error: Failed to  Create Invoice.",
		};
	}
	revalidatePath("/dashboard/invoices");
	redirect("/dashboard/invoices");
}

const UpdateInvoice = FormSchema.omit({ id: true, date: true });
export async function updateInvoice(id: string, formData: FormData) {
	const { customer_id, amount, status } = UpdateInvoice.parse({
		customer_id: formData.get("customer_id"),
		amount: formData.get("amount"),
		status: formData.get("status"),
	});

	const amountInCents = amount * 100;

	try {
		const client = await clientPromise;
		const collection = client
			.db("nextjs-dashboard-tutorial")
			.collection("invoices");
		collection.updateOne(
			{ _id: new ObjectId(id) },
			{
				$set: {
					customer_id: new ObjectId(customer_id),
					amount: amountInCents,
					status: status,
				},
			}
		);
	} catch (e) {
		return {
			message: "Database Error: Failed to Update Invoice.",
		};
	}
	revalidatePath("/dashboard/invoices");
	redirect("/dashboard/invoices");
}

export async function deleteInvoice(id: string) {
	try {
		const client = await clientPromise;
		const collection = client
			.db("nextjs-dashboard-tutorial")
			.collection("invoices");
		collection.deleteOne({ _id: new ObjectId(id) });
	} catch (e) {
		return {
			message: "Database Error: Failed to  Delete Invoice.",
		};
	}

	revalidatePath("/dashboard/invoices");
}
