// Mock typeorm to avoid path-scurry v2 / Node.js 22 compatibility issue
// and to provide basic decorators for entity files

// Minimal decorator implementations
const noop = () => {};
export const Column = noop;
export const Entity = noop;
export const PrimaryGeneratedColumn = noop;
export const CreateDateColumn = noop;
export const UpdateDateColumn = noop;
export const ManyToOne = noop;
export const JoinColumn = noop;
export const OneToMany = noop;
export const Index = noop;
export const Unique = noop;

export class Repository<T = any> {
  find = jest.fn();
  findOne = jest.fn();
  create = jest.fn();
  save = jest.fn();
  remove = jest.fn();
  delete = jest.fn();
  update = jest.fn();
  insert = jest.fn();
  createQueryBuilder = jest.fn();
}

export const getRepositoryToken = jest.fn((entity: any) => `REPO_${entity.name}`);
export const InjectRepository = () => (target: any, _key: string, _index: number) => {};
export const Between = (from: any, to: any) => ({ __type: 'Between', from, to });
export const In = (values: any[]) => ({ __type: 'In', values });
