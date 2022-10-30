# appmap-agent-validate protocol

Validates the project configuration.

Output:

    {
      "errors": [
        {
          "level":  "warning" | "error",
          "setting": "configuration", (logical setting name, if known)
          "filename": <path to file>, (if known)
          "message": <error message>,
          "detailed_message": <error message details, if known>,
          "help_urls": [ <url to FAQ, troubleshooting, etc, if known> ]
        },
        ...
      ],
      "schema": {
        ... JSON schema ... 
      }
    }

The "schema" attribute contains the JSON schema for the agent configuration (usually found in a project's appmap.yml). For example, appmap-ruby's schema is here: https://github.com/applandinc/appmap-ruby/blob/master/config-schema.yml.

Example

    {
      "errors": [
        {
          "level": "warning",
          "filename": "Gemfile",
          "message": "appmap gem should precede other gems in the Gemfile",
          "help_urls": [ "https://appland.com/docs/faq/ruby#some-header" ]
        },
        {
          "level": "error",
          "setting": "configuration",
          "filename": "appmap.yml",
          "message": "AppMap configuration is not valid YAML",
          "detailed_message": "Parse error at line 5: <whatever>"
        }
      ],
      "schema": {
        ... JSON schema ...
      }
    }
