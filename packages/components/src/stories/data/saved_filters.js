import { DEFAULT_FILTER_NAME } from '@/store/vsCode';

export default [
  {
    filterName: DEFAULT_FILTER_NAME,
    // {filters:{hideExternal:false}} for backwards compatibility with tests
    state: 'eyJmaWx0ZXJzIjp7ImhpZGVFeHRlcm5hbCI6ZmFsc2V9fQ==',
    default: true,
  },
  {
    filterName: 'another test',
    // {"filters":{"limitRootEvents":false,"hideUnlabeled":true,"hideExternal":false}}
    state: 'eyJmaWx0ZXJzIjp7ImxpbWl0Um9vdEV2ZW50cyI6ZmFsc2UsImhpZGVVbmxhYmVsZWQiOnRydWUsImhpZGVFeHRlcm5hbCI6ZmFsc2V9fQ==',
    default: false,
  },
  {
    filterName: 'filter',
    // {"filters":{"limitRootEvents":false,"hideMediaRequests":false,"hideElapsedTimeUnder":1,"hideExternal":false}}
    state:
      'eyJmaWx0ZXJzIjp7ImxpbWl0Um9vdEV2ZW50cyI6ZmFsc2UsImhpZGVNZWRpYVJlcXVlc3RzIjpmYWxzZSwiaGlkZUVsYXBzZWRUaW1lVW5kZXIiOjEsImhpZGVFeHRlcm5hbCI6ZmFsc2V9fQ==',
    default: false,
  },
];
