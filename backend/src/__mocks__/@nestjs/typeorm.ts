export const getRepositoryToken = jest.fn((entity: any) => `REPO_${entity.name}`);
export const InjectRepository = () => (target: any, _key: string, _index: number) => {};
export const TypeOrmModule = { forFeature: jest.fn(), forRoot: jest.fn() };
