import App from '../src/app';
import { queueTest } from './vcr';

describe('app', () => {
  describe('listFindingStatus', () => {
    it(
      'is provided',
      queueTest(async function () {
        const status = await new App(
          'kgilpin@gmail.com/sample_app_6th_ed'
        ).listFindingStatus();
        expect(status).toEqual([
          {
            app_id: 35,
            identity_hash:
              'cd17019c105fcbe54446e68c6185625dee8c565d98e1b8444693e2e14b369609',
            status: 'deferred',
          },
          {
            app_id: 35,
            identity_hash:
              '92f72dbac0ef1348104f3669cf97174c704b2bfa1db98054559127d56f8c681a',
            status: 'deferred',
          },
          {
            app_id: 35,
            identity_hash:
              '0e9e40b01a5e6f743f8a4b647b24e861224e87c555acf6a78893023d222d2f41',
            status: 'new',
          },
          {
            app_id: 35,
            identity_hash:
              '3d37917094c653a707d7a049381e9467097441d6b3037686a31fafc5d7042dd6',
            status: 'deferred',
          },
          {
            app_id: 35,
            identity_hash:
              '55634d2b1d43a497c3c9f8610ad0db5ae6ad47096d5ff334223068e9f27625c8',
            status: 'new',
          },
          {
            app_id: 35,
            identity_hash:
              '26c8138f0d556d886911ccc227ce8f1f12c919852f5a89b846b6271f5c876a55',
            status: 'new',
          },
          {
            app_id: 35,
            identity_hash:
              '31884b9208e8db12ec714ce490d1f29e2430459303ad8e291d1bdeedd20a7af9',
            status: 'new',
          },
          {
            app_id: 35,
            identity_hash:
              '3292c7e87bd258d48023966f0faf005ac82975b0dfb45a812b10beed7f4bafca',
            status: 'deferred',
          },
        ]);
      })
    );
  });
});
