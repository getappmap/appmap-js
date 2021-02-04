const HTTP_PACKAGE = 'HTTP';
const SQL_PACKAGE = 'SQL';

export default class Components {
  constructor(scenarioData) {
    /* eslint-disable camelcase */
    // map of all packages which are invoked from each package
    this.package_calls = {}; // Hash.new { |h, k| h[k] = Set.new }
    // for each class, a set of classes which are called
    this.class_calls = {}; // Hash.new { |h, k| h[k] = Set.new }
    // for each class, a set of classes which are its callers
    this.class_callers = {}; // Hash.new { |h, k| h[k] = Set.new }
    // map of all classes in each package
    this.package_classes = {}; // Hash.new { |h, k| h[k] = Set.new }
    // the package of each class
    this.class_package = {};
    // Packages which are invoked from HTTP_PACKAGE
    this.controller_packages = new Set();
    // Packages which invoke a SQL query
    this.querying_packages = new Set();
    // All packages
    this.packages = new Set();
    // Path and line numbers of classes
    this.class_locations = {};
    // Source control related metadata
    this.source_control = {};
    /* eslint-enable camelcase */

    if (!scenarioData.events || !scenarioData.classMap) {
      return;
    }

    const locationIndex = {};
    const fqPackageName = [];
    const fqClassName = [];

    function buildLocationIndex(cls) {
      if (cls.type === 'class') {
        fqClassName.push(cls.name);
      }
      if (cls.type === 'package') {
        fqPackageName.push(cls.name);
      }

      if (cls.type === 'function') {
        const locationKey = [cls.location || '<path>:<line>', cls.name].join(
          '#',
        );
        const className = fqClassName.join('::');
        const packageName = fqPackageName.join('/');
        locationIndex[locationKey] = { className, packageName };
      }

      (cls.children || []).forEach(buildLocationIndex);

      if (cls.type === 'class') {
        fqClassName.pop();
      }
      if (cls.type === 'package') {
        fqPackageName.pop();
      }
    }

    scenarioData.classMap.forEach(buildLocationIndex);

    const callStack = [];
    const uniqueInvocations = new Set();
    const invocationGraph = [];
    scenarioData.events.forEach((event) => {
      if (event.event === 'return') {
        return callStack.pop();
      }

      const locationKey = [
        [event.path || '<path>', event.lineno || '<line>'].join(':'),
        event.method_id,
      ].join('#');
      let calleeClassDef;
      if (event.sql_query) {
        calleeClassDef = { className: SQL_PACKAGE, packageName: SQL_PACKAGE };
      } else if (event.http_server_request) {
        calleeClassDef = {
          className: `${event.http_server_request.request_method} ${event.http_server_request.path_info}`,
          packageName: HTTP_PACKAGE,
        };
      } else {
        calleeClassDef = locationIndex[locationKey];
        if (!calleeClassDef) {
          // define custom package and class when location is unknown
          calleeClassDef = {
            className: event.defined_class,
            packageName: event.defined_class.split('::')[0],
          };
        }
      }

      if (callStack.length > 0) {
        const callerClassDef = callStack[callStack.length - 1];
        const call = [callerClassDef, calleeClassDef];
        const callKey = JSON.stringify(call);
        if (uniqueInvocations.add(callKey)) {
          invocationGraph.push(call);
        }
      }

      callStack.push(calleeClassDef);

      return null;
    });

    invocationGraph.forEach((call) => {
      call.forEach((type) => {
        this.packages.add(type.packageName);
        if (!this.package_classes[type.packageName]) {
          this.package_classes[type.packageName] = new Set();
        }
        this.package_classes[type.packageName].add(type.className);
        this.class_package[type.className] = type.packageName;
      });

      const [caller, callee] = call;

      if (caller.packageName === HTTP_PACKAGE) {
        this.controller_packages.add(callee.packageName);
      }
      if (callee.packageName === SQL_PACKAGE) {
        this.querying_packages.add(caller.packageName);
      }

      if (!this.package_calls[caller.packageName]) {
        this.package_calls[caller.packageName] = new Set();
      }
      this.package_calls[caller.packageName].add(callee.packageName);

      if (!this.class_calls[caller.className]) {
        this.class_calls[caller.className] = new Set();
      }
      this.class_calls[caller.className].add(callee.className);

      if (!this.class_callers[callee.className]) {
        this.class_callers[callee.className] = new Set();
      }
      this.class_callers[callee.className].add(caller.className);
    });
  }
}
