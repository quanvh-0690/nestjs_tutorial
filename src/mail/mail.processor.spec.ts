import { Test } from '@nestjs/testing';
import type { Job } from 'bull';
import { MailProcessor } from './mail.processor.js';
import { MailerService } from './mailer.service.js';
import type { NewFollowerMailData, WelcomeMailData } from './mail.constants.js';

/** Unit test: mock MailerService, only checks the processor sends the right content */
describe('MailProcessor', () => {
  let processor: MailProcessor;
  const mailer = { send: vi.fn() };

  beforeEach(async () => {
    mailer.send.mockReset();
    const moduleRef = await Test.createTestingModule({
      providers: [MailProcessor, { provide: MailerService, useValue: mailer }],
    }).compile();
    processor = moduleRef.get(MailProcessor);
  });

  it('sends the welcome mail', async () => {
    await processor.handleWelcome({
      data: { email: 'a@b.com', username: 'alice' },
    } as Job<WelcomeMailData>);
    expect(mailer.send).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'a@b.com',
        subject: 'Welcome to Medium Clone!',
      }),
    );
  });

  it('sends the new-follower mail and escapes HTML', async () => {
    await processor.handleNewFollower({
      data: {
        email: 'a@b.com',
        username: 'alice',
        followerUsername: '<b>bob</b>',
      },
    } as Job<NewFollowerMailData>);
    const sent = mailer.send.mock.calls[0][0];
    expect(sent.html).toContain('&lt;b&gt;bob&lt;/b&gt;');
  });
});
