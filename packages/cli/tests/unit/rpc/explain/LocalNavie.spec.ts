import LocalNavie from '../../../../src/rpc/explain/navie/navie-local';

describe('LocalNavie', () => {
  let navie: LocalNavie;
  let contextProvider = jest.fn();
  let projectInfoProvider = jest.fn();
  let helpProvider = jest.fn();

  beforeEach(
    () => (navie = new LocalNavie('threadId', contextProvider, projectInfoProvider, helpProvider))
  );

  describe('setOptions', () => {
    it("should set 'temperature'", () => {
      navie.setOption('temperature', 0.5);
      expect(navie.navieOptions.temperature).toBe(0.5);
    });
    it("should set 'modelName'", () => {
      navie.setOption('modelName', 'model');
      expect(navie.navieOptions.modelName).toBe('model');
    });
    it("should set 'tokenLimit'", () => {
      navie.setOption('tokenLimit', 100);
      expect(navie.navieOptions.tokenLimit).toBe(100);
    });
    it("should ignore 'explainMode'", () => {
      navie.setOption('explainMode', 'mode');
    });
    it('should throw an error for unsupported option', () => {
      expect(() => navie.setOption('unsupported', 'value')).toThrowError(
        "LocalNavie does not support option 'unsupported'"
      );
    });
  });
});
