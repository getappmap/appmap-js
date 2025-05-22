import type { AppMap, CodeObject } from '@appland/models';

function stringify(value: unknown): string {
  if (Array.isArray(value)) {
    return value.map((v) => stringify(v)).join(', ');
  } else if (typeof value === 'object' && value !== null) {
    return JSON.stringify(value);
  } else {
    return String(value);
  }
}

export default function convertToCondensedFormat(appmap: AppMap): string {
  const output: string[] = [];

  // Metadata section
  Object.entries(appmap.metadata).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      output.push(`META ${key}: ${value.join(', ')}`);
    } else {
      output.push(`META ${key}: ${stringify(value)}`);
    }
  });
  output.push('');

  // Class Map section
  function processClassMapEntry(entry: CodeObject, indent = 0): void {
    const indentation = '  '.repeat(indent);

    if (entry.type === 'package') {
      output.push(`${indentation}CLASS package: ${entry.name}`);
    } else {
      const location = entry.location ? ` (${entry.location})` : '';
      const labels = entry.labels?.size ? ` labels: ${[...entry.labels].join(',')}` : '';
      const isStatic = entry.type === 'function' && entry.static ? ' static' : '';

      if (entry.type === 'class') {
        output.push(`${indentation}CLASS ${entry.name}${location}`);
      } else if (entry.type === 'function') {
        output.push(`${indentation}FUNC ${entry.name}${location}${isStatic}${labels}`);
      }
    }

    if (entry.children) {
      entry.children.forEach((child) => processClassMapEntry(child, indent + 1));
    }
  }

  appmap.classMap.roots.forEach((entry) => processClassMapEntry(entry));
  output.push('');

  // Events section
  appmap.events.forEach((event) => {
    if (event.isCall()) {
      let eventLine = `EVENT CALL id:${event.id} thread:${event.threadId}`;

      if (event.definedClass && event.methodId) {
        eventLine += ` ${event.definedClass}.${event.methodId}`;
      }

      // Handle parameters
      if (event.parameters?.length) {
        const params = event.parameters.map((p) => `${p.name}: ${p.value}`).join(', ');
        eventLine += `(${params})`;
      }

      // Handle receiver
      if (event.receiver) {
        eventLine += ` receiver: ${event.receiver.value}`;
      }

      // Handle HTTP requests
      if (event.httpServerRequest) {
        const req = event.httpServerRequest;
        eventLine += ` ${req.request_method} ${req.path_info}`;
        eventLine += ` headers: ${JSON.stringify(req.headers)}`;
        eventLine += ` normalized: ${req.normalized_path_info}`;
        eventLine += ` params: ${JSON.stringify(event.message)}`;
      }

      // Handle SQL queries
      if (event.sql) {
        eventLine += ` SQL ${event.sql.database_type}: ${event.sql.sql}`;
      }

      output.push(eventLine);
    } else if (event.isReturn()) {
      let eventLine = `EVENT RETURN id:${event.id}`;

      if (event.parentId) {
        eventLine += ` parent:${event.parentId}`;
      }

      if (event.elapsedTime !== undefined) {
        eventLine += ` elapsed:${event.elapsedTime}`;
      }

      if (event.returnValue) {
        eventLine += ` return: ${event.returnValue.value}`;
      }

      if (event.exceptions?.length)
        for (const exception of event.exceptions)
          eventLine += ` EXCEPTION ${exception.class}: ${exception.message}`;

      output.push(eventLine);
    }
  });

  return output.join('\n');
}
