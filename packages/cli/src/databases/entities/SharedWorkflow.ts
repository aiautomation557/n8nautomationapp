import { Column, Entity, ManyToOne, PrimaryColumn } from 'typeorm';
import { WorkflowEntity } from './WorkflowEntity';
import { User } from './User';
import { WithTimestamps } from './AbstractEntity';
import type { Project } from './Project';

export type WorkflowSharingRole = 'workflow:owner' | 'workflow:editor' | 'workflow:user';

@Entity()
export class SharedWorkflow extends WithTimestamps {
	@Column()
	role: WorkflowSharingRole;

	@ManyToOne('User', 'sharedWorkflows')
	user: User;

	@PrimaryColumn()
	userId: string;

	@ManyToOne('WorkflowEntity', 'shared')
	workflow: WorkflowEntity;

	@PrimaryColumn()
	workflowId: string;

	@ManyToOne('Project', 'sharedWorkflows', { nullable: true })
	project: Project | null;

	// We're lying to typeorm that this isn't a primary key for now
	// because it can't handle nullable primary keys.
	@Column({ nullable: true })
	projectId: string | null;
}
