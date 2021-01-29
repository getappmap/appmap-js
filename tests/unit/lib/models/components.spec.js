import { Components } from '@/lib/models';
import scenario from '../../fixtures/scenario.json';

describe('Components model', () => {
  const components = new Components(scenario);

  test('model is correct', () => {
    expect(components.packages.size).toEqual(6);
    expect(components.packages.has('HTTP')).toEqual(true);
    expect(components.packages.has('app/controllers')).toEqual(true);
    expect(components.packages.has('app/models')).toEqual(true);
    expect(components.packages.has('SQL')).toEqual(true);
    expect(components.package_classes.HTTP.has('PUT /applications/5')).toEqual(
      true
    );
    expect(components.package_classes['app/controllers'].size).toEqual(2);
    expect(components.package_classes['app/models'].size).toEqual(7);
  });
});
