---
layout: docs
title: Docs - AppMap Navie
description: "Reference Guide to AppMap Navie AI, a complete list of options available in AppMap Navie AI."
name: Navie Options
navie-reference: true
step: 4
toc: true
---

# Navie Options

Navie supports forward-slash options that can be included at the beginning of your questions to control various aspects of text generation. 

## /tokenlimit

The `/tokenlimit` option is used to specify a limit on the number of tokens processed by the system. This parameter can help control the length of the generated text or manage resource consumption effectively.

**Syntax**
```shell
/tokenlimit=<value>
```
- `<value>`: The maximum number of tokens to be processed. This can be either a string or a number. If provided as a string, it will be automatically converted to an integer.

**Description**
When executing commands, the `/tokenlimit` option sets the upper limit on the number of tokens the system should utilize. The default token limit is 8000. Increasing the token limit allows more space for context.

**Example**
To set the token limit to 16000, you can use:
```shell
@explain /tokenlimit=16000 <question>
```

**Notes**
- It's important to ensure that the value provided for `/tokenlimit` is a valid positive integer.
- The effect of `/tokenlimit` can directly impact the performance and output length of text generation processes.
- The `/tokenlimit` cannot be increased above the fundamental limit of the LLM backend. Some backends, such as Copilot, may have a lower token limit than others.


## /temperature

The `/temperature` option is used to control the randomness of the text generation process. This parameter can help adjust the creativity and diversity of the generated text.

**Syntax**
```shell
/temperature=<value>
```

- `<value>`: The temperature value to be set. This can be either a string or a number. If provided as a string, it will be automatically converted to a float.

**Description**
When executing commands, the `/temperature` option sets the randomness of the text generation process. The default temperature value is 0.2. Lower values result in more deterministic outputs, while higher values lead to more creative and diverse outputs.

**Example**
To set the temperature to 0, you can use:
```shell
@generate /temperature=0 <question>
```

**Notes**

- It's important to ensure that the value provided for `/temperature` is a valid float.
- The effect of `/temperature` can directly impact the creativity and diversity of the generated text.

## /gather

The `/gather` option is used to enable or disable the context gathering feature. This option allows
you to control whether Navie should gather additional context from the repository to enhance its
responses. By default, context gathering is enabled in the following situations:

- When performing `@generate` and `@plan`.
- When the `overview` classifier is applied automatically by Navie to the question.

When enabled, gather will perform any or all of the following actions:

- List files in the repository.
- Fetch full the full content of a file in the repository.
- Search the repository for context by keyword.

Gatherer runs autonomously, there's no user control over what actions it will take. To explicitly
control the context that's available to Navie, you can other features such as pinned files,
`/include` and `/exclude` options.

**Syntax**

```shell
/gather=<true|false>
```

- `<true|false>`: A boolean value indicating whether to enable (`true`) or disable (`false`) the
  context gathering feature.

**Example** To enable context gathering, you can use:

```shell
@generate /gather=true <question>
```

## /include and /exclude

The `/include` and `/exclude` options are used to include or exclude specific file patterns from the retrieved context.

**Syntax**
```shell
/include=<word-or-pattern>|<word-or-pattern> /exclude=<word-or-pattern>|<word-or-pattern>
```

- `<word-or-pattern>`: The word or pattern to be included or excluded. Multiple values or patterns can be separated by a pipe `|`, because the entire string is treated as a
  regular expression.

**Description**

When executing commands, the `/include` option includes files according to the words or patterns specified, while the `/exclude` option excludes them. This can help control the context used by the system to generate text.

**Example**

To include only Python files and exclude files containing the word "test":

```shell
@plan /include=\.py /exclude=test
```