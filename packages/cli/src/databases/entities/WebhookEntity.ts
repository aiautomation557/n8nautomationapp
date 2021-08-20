import { Column, Entity, Index, PrimaryColumn } from 'typeorm';

// eslint-disable-next-line import/no-cycle
import { IWebhookDb } from '../../Interfaces';

@Entity()
@Index(['webhookId', 'method', 'pathLength'])
// eslint-disable-next-line import/prefer-default-export
export class WebhookEntity implements IWebhookDb {
	@Column()
	workflowId: number;

	@PrimaryColumn()
	webhookPath: string;

	@PrimaryColumn()
	method: string;

	@Column()
	node: string;

	@Column({ nullable: true })
	webhookId: string;

	@Column({ nullable: true })
	pathLength: number;
}
