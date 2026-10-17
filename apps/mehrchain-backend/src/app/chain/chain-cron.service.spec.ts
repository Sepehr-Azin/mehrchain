import { ChainCronService } from './chain-cron.service';

describe('Habit lifecycle sweep', () => {
  const prisma = { user: { findMany: jest.fn() } };
  const lifecycle = { reconcileUser: jest.fn() };
  let service: ChainCronService;

  beforeEach(() => {
    jest.resetAllMocks();
    service = new ChainCronService(prisma as any, lifecycle as any);
  });

  it('uses the same reconciliation as request paths, including solo accounts', async () => {
    prisma.user.findMany.mockResolvedValue([{ id: 'solo' }, { id: 'linked' }]);
    await service.handleDailyChainFreeze();
    expect(lifecycle.reconcileUser.mock.calls).toEqual([['solo'], ['linked']]);
  });

  it('continues other accounts after one account fails', async () => {
    prisma.user.findMany.mockResolvedValue([{ id: 'a' }, { id: 'b' }]);
    lifecycle.reconcileUser.mockRejectedValueOnce(new Error('temporary database failure'));
    await service.handleDailyChainFreeze();
    expect(lifecycle.reconcileUser).toHaveBeenCalledWith('b');
  });
});
