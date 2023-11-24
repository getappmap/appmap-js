import { Diagram, FormatType } from './types';

import * as json from './formatter/json';
import * as plantUML from './formatter/plantUML';
import * as text from './formatter/text';

export default function format(
  formatType: FormatType,
  diagram: Diagram,
  source: string,
  options: Record<string, boolean | string> = {}
): { extension: string; diagram: string } {
  switch (formatType) {
    case FormatType.JSON:
      return { extension: json.extension, diagram: json.format(diagram) };
    case FormatType.PlantUML:
      return { extension: plantUML.extension, diagram: plantUML.format(diagram, source, options) };
    case FormatType.Text:
      return { extension: text.extension, diagram: text.format(diagram) };
  }
}
