import { relations, type InferSelectModel, sql } from 'drizzle-orm';
import {
	bigint,
	uniqueIndex,
	pgTable,
	varchar,
	uuid,
	text,
	primaryKey,
	integer,
	timestamp,
	pgEnum,
	doublePrecision
} from 'drizzle-orm/pg-core';

export const user = pgTable(
	'auth_user',
	{
		id: varchar('id', {
			length: 15
		}).primaryKey(),
		username: varchar('username', { length: 64 }).notNull()
	},
	(user) => {
		return {
			nameIndex: uniqueIndex('name_idx').on(user.username)
		};
	}
);

export const session = pgTable('user_session', {
	id: varchar('id', {
		length: 128
	}).primaryKey(),
	userId: varchar('user_id', {
		length: 15
	})
		.notNull()
		.references(() => user.id),
	activeExpires: bigint('active_expires', {
		mode: 'number'
	}).notNull(),
	idleExpires: bigint('idle_expires', {
		mode: 'number'
	}).notNull()
});

export const key = pgTable('user_key', {
	id: varchar('id', {
		length: 255
	}).primaryKey(),
	userId: varchar('user_id', {
		length: 15
	})
		.notNull()
		.references(() => user.id),
	hashedPassword: varchar('hashed_password', {
		length: 255
	})
});

export const branches = pgTable('branches', {
	id: uuid('id').primaryKey(),
	userId: varchar('user_id', { length: 15 })
		.notNull()
		.references(() => user.id),
	address: varchar('address', { length: 100 }).notNull(),
	latitude: doublePrecision('latitude').notNull(),
	longitude: doublePrecision('longitude').notNull()
});

export const branchesRelations = relations(branches, ({ one }) => ({
	user: one(user, {
		fields: [branches.userId],
		references: [user.id]
	})
}));

export const floorplans = pgTable('floorplans', {
	id: uuid('id').primaryKey(),
	branchId: uuid('branch_id')
		.notNull()
		.references(() => branches.id, { onDelete: 'cascade' }),
	imgPath: text('img_path').notNull(),
	width: integer('width').notNull(),
	height: integer('height').notNull()
});

export const floorplansRelations = relations(floorplans, ({ one, many }) => ({
	branch: one(branches, {
		fields: [floorplans.branchId],
		references: [branches.id]
	}),
	beaconsToFloorplans: many(beaconsToFloorplans)
}));

export const beacons = pgTable('beacons', {
	id: uuid('id').primaryKey(),
	branchId: uuid('branch_id')
		.notNull()
		.references(() => branches.id, { onDelete: 'cascade' }),
	proximityUUID: uuid('proximity_uuid').notNull(),
	major: integer('major').notNull(),
	minor: integer('minor').notNull(),
	radius: doublePrecision('radius').notNull(),
	name: varchar('name', { length: 40 })
});

export const beaconsRelations = relations(beacons, ({ one, many }) => ({
	branch: one(branches, {
		fields: [beacons.branchId],
		references: [branches.id]
	}),
	campaigns: many(campaignsToBeacons),
	floorplan: one(beaconsToFloorplans, {
		fields: [beacons.id],
		references: [beaconsToFloorplans.beaconId]
	})
}));

export const campaignStatusEnum = pgEnum('campaignStatus', ['active', 'inactive']);

export const campaigns = pgTable('campaigns', {
	id: uuid('id').primaryKey(),
	branchId: uuid('branch_id')
		.notNull()
		.references(() => branches.id, { onDelete: 'cascade' }),
	name: text('text').notNull(),
	status: campaignStatusEnum('campaign_status').notNull().default('inactive'),
	createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`)
});

export const productGroups = pgTable('product_groups', {
	id: uuid('id').primaryKey(),
	groupName: varchar('group_name', { length: 40 }).notNull() // Changed to 'groupName' of type 'string'
});

export const productGroupsToCampaigns = pgTable(
	'product_groups_to_campaigns',
	{
		campaignId: uuid('campaign_id')
			.notNull()
			.references(() => campaigns.id, { onDelete: 'cascade' }),
		productGroupId: uuid('product_group_id')
			.notNull()
			.references(() => productGroups.id, { onDelete: 'cascade' }) // Reference to productGroups id
	},
	(table) => {
		return {
			pk: primaryKey({ columns: [table.campaignId, table.productGroupId] })
		};
	}
);

export const campaignsRelations = relations(campaigns, ({ one, many }) => ({
	branch: one(branches, {
		fields: [campaigns.branchId],
		references: [branches.id]
	}),
	beacons: many(campaignsToBeacons)
}));

export const campaignsToBeacons = pgTable(
	'campaigns_to_beacons',
	{
		campaignId: uuid('campaign_id')
			.notNull()
			.references(() => campaigns.id, { onDelete: 'cascade' }),
		beaconId: uuid('beacon_id')
			.notNull()
			.references(() => beacons.id, { onDelete: 'cascade' })
		// TODO  we should remove onDelete since it does not work with multiple priamry keys
		// refer to https://www.answeroverflow.com/m/1182472423266856970 and https://github.com/drizzle-team/drizzle-orm/pull/1636
	},
	(table) => {
		return {
			pk: primaryKey({ columns: [table.campaignId, table.beaconId] })
		};
	}
);

export const campaignsToBeaconsRelations = relations(campaignsToBeacons, ({ one }) => ({
	beacon: one(beacons, {
		fields: [campaignsToBeacons.beaconId],
		references: [beacons.id]
	}),
	campaign: one(campaigns, {
		fields: [campaignsToBeacons.campaignId],
		references: [campaigns.id]
	})
}));

export const beaconsToFloorplans = pgTable(
	'beacons_to_floorplans',
	{
		beaconId: uuid('beacon_id')
			.notNull()
			.references(() => beacons.id, { onDelete: 'cascade' }),
		floorplanId: uuid('floorplan_id')
			.notNull()
			.references(() => floorplans.id, { onDelete: 'cascade' }),
		x: doublePrecision('x').notNull(),
		y: doublePrecision('y').notNull()
		// TODO  we should remove onDelete since it does not work with multiple priamry keys
		// refer to https://www.answeroverflow.com/m/1182472423266856970 and https://github.com/drizzle-team/drizzle-orm/pull/1636
	},
	(table) => {
		return {
			pk: primaryKey({ columns: [table.beaconId, table.floorplanId] })
		};
	}
);

export const beaconsToFloorplansRelations = relations(beaconsToFloorplans, ({ one }) => ({
	beacon: one(beacons, {
		fields: [beaconsToFloorplans.beaconId],
		references: [beacons.id]
	}),
	floorplan: one(floorplans, {
		fields: [beaconsToFloorplans.floorplanId],
		references: [floorplans.id]
	})
}));

export const customers = pgTable('customers', {
	id: uuid('id').primaryKey(),
	customerId: varchar('customer_id', { length: 15 }).notNull()
});

export const events = pgTable('events', {
	id: uuid('id').primaryKey(),
	status: text('status').notNull(),
	enterTimestamp: timestamp('enter_timestamp', { withTimezone: true }).notNull(),
	possibleExitTimestamp: timestamp('possible_exit_timestamp', { withTimezone: true }).notNull(),
	// although it may seem that we can obtain below three fields by some joins, those fields will
	// correspond to up-to-date information about beacon position and radius, but a beacon position
	// or radius might be changed after the occurrence of an event. Therefore we need to save the
	// position and radius at the time event occurred.
	locationX: doublePrecision('location_x').notNull(),
	locationY: doublePrecision('location_y').notNull(),
	radius: doublePrecision('radius').notNull(),
	customerId: uuid('customer_id')
		.notNull()
		.references(() => customers.id),
	branchId: uuid('branch_id')
		.notNull()
		.references(() => branches.id),
	beaconId: uuid('beacon_id')
		.notNull()
		.references(() => beacons.id),
	campaignId: uuid('campaign_id')
		.notNull()
		.references(() => campaigns.id)
});

export type SelectBranch = InferSelectModel<typeof branches>;
export type SelectFloorplan = InferSelectModel<typeof floorplans>;
export type SelectCampaign = InferSelectModel<typeof campaigns>;
export type SelectBeacon = InferSelectModel<typeof beacons>;

export type SelectBeaconWithFloorplan = {
	floorplan: typeof beaconsToFloorplans.$inferSelect;
} & typeof beacons.$inferSelect;

export type SelectFloorplanWithBeacons = {
	beaconsToFloorplans: {
		beacon: typeof beacons.$inferSelect;
	}[];
} & typeof floorplans.$inferSelect;

export type SelectCampaignWithBeacons = {
	beacons: {
		beacon: SelectBeaconWithFloorplan;
	}[];
} & typeof campaigns.$inferSelect;

export type SelectEvent = {
	[events._.name]: typeof events.$inferSelect;
	// [customers._.name]: typeof customers.$inferSelect;
	[beacons._.name]: typeof beacons.$inferSelect;
	[campaigns._.name]: typeof campaigns.$inferSelect;
};

export enum EventStatus {
	ENTER = 'ENTER',
	EXIT = 'EXIT',
	STAY = 'STAY'
}
