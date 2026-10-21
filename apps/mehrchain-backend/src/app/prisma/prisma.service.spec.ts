import { PrismaService } from './prisma.service';

describe('Production schema readiness', () => {
  const originalNodeEnv = process.env['NODE_ENV'];
  let service: PrismaService;

  beforeEach(() => {
    process.env['NODE_ENV'] = 'production';
    service = new PrismaService();
    jest.spyOn(service, '$connect').mockResolvedValue(undefined);
    jest.spyOn(service, '$disconnect').mockResolvedValue(undefined);
    jest.spyOn(service, '$queryRaw').mockResolvedValue([]);
  });

  afterEach(() => {
    if (originalNodeEnv === undefined) delete process.env['NODE_ENV'];
    else process.env['NODE_ENV'] = originalNodeEnv;
    jest.restoreAllMocks();
  });

  it('allows a migrated database to finish initialization', async () => {
    await service.onModuleInit();
    expect(service.$queryRaw).toHaveBeenCalledTimes(12);
    expect(service.$disconnect).not.toHaveBeenCalled();
  });

  it.each([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12])(
    'refuses readiness when required schema probe %i fails',
    async (probe) => {
      const query = jest.mocked(service.$queryRaw);
      for (let i = 1; i < probe; i++) query.mockResolvedValueOnce([]);
      query.mockRejectedValueOnce(new Error('missing column (private database detail)'));
      await expect(service.onModuleInit()).rejects.toThrow('apply the reviewed release migrations');
      expect(service.$disconnect).toHaveBeenCalled();
    },
  );
});
