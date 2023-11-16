import { db } from '$lib/server/db';
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { eq } from 'drizzle-orm';
import { campaigns, type SelectCampaign } from '../../schema';

export const load: PageServerLoad = async ({ locals }) => {
	const session = await locals.auth.validate();
	console.log(session);
	if (!session) throw redirect(302, '/login');

	return {};
};

export const actions = {
	createCampaign: async ({ locals, request }) => {
		const session = await locals.auth.validate();
		if (session) {
			const data = await request.formData();
			const campaignName = data.get('name') as string;

			const campaign = {
				userId: session.user.userId,
				name: campaignName,
				id: crypto.randomUUID()
			};
			await db.insert(campaigns).values(campaign);

			console.log(locals);
		}
	}
};
