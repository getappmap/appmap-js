#!/usr/bin/env python3

import argparse
import os
import re
import subprocess
import sys
import json


def run_command(command):
    result = subprocess.run(command, shell=True, capture_output=True)
    if result.returncode != 0:
        print(
            f"Error: Command '{command}' failed with message: {result.stderr.decode()}"
        )
        sys.exit(1)
    return result.stdout.decode()


def run_navie_command(
    command,
    output_path,
    log_path,
    context_path=None,
    input_path=None,
    additional_args=None,
):
    """
    Execute the navie command with specified arguments.

    :param command: Command to execute (e.g., 'navie')
    :param context_path: Path to the context file
    :param input_path: Path to the input file
    :param output_path: Path to the output file
    :param log_path: Path to the log file
    :param additional_args: Additional arguments for the command
    :return: None
    """
    # Build the command
    cmd = f"{command} navie --log-navie"
    if input_path:
        cmd += f" -i {input_path}"
    if context_path:
        cmd += f" -c {context_path}"
    cmd += f" -o {output_path}"
    if additional_args:
        cmd += f" {additional_args}"
    cmd += f" > {log_path} 2>&1"

    result = os.system(cmd)

    if result != 0:
        raise RuntimeError(
            f"Failed to execute command {cmd}. See {log_path} for details."
        )


def main():
    parser = argparse.ArgumentParser(
        description="Solve software issue described in a file."
    )
    parser.add_argument(
        "directory", type=str, help="Working directory of the project to modify"
    )
    parser.add_argument(
        "issue_file", type=str, help="File containing the issue description"
    )

    # Options to enable lint-based repair.
    parser.add_argument(
        "--lint-command", type=str, help="lint command to use", default=None
    )
    parser.add_argument(
        "--lint-error-pattern", type=str, help="lint error pattern to use", default=None
    )

    # Option to change the default appmap command.
    parser.add_argument(
        "--appmap-command", type=str, help="appmap command to use", default="appmap"
    )

    # Options to disable steps of the process, typically because they have already been
    # performed and the objective of the script is to perform and debug the remaining steps.
    parser.add_argument("--noplan", action="store_true", help="Do not generate a plan")
    parser.add_argument(
        "--nolist", action="store_true", help="Do not list files to be modified"
    )
    parser.add_argument(
        "--nogenerate", action="store_true", help="Do not generate code"
    )
    parser.add_argument("--noapply", action="store_true", help="Do not apply changes")

    args = parser.parse_args()

    if not os.path.isfile(args.issue_file):
        print(f"Error: File '{args.issue_file}' not found.", file=sys.stderr)
        sys.exit(1)

    issue_file = os.path.abspath(args.issue_file)
    work_dir = os.path.dirname(issue_file)

    if args.directory:
        os.chdir(args.directory)

    appmap_command = args.appmap_command

    plan_file = os.path.join(work_dir, "plan.md")

    if not args.noplan:
        print(f"Transforming issue {args.issue_file} into a plan")

        plan_prompt = os.path.join(work_dir, "plan.txt")
        with open(plan_prompt, "w") as plan_f:
            plan_f.write(
                """@plan /nocontext /noformat

## Guidelines

* Try to solve the problem with a minimal set of code changes.

* Avoid refactorings that will affect multiple parts of the codebase.

* Do not output code blocks or fenced code. Output only a text description of the suggested
    changes, along with the file names.
"""
            )

        run_navie_command(
            command=appmap_command,
            context_path=issue_file,
            input_path=plan_prompt,
            output_path=plan_file,
            log_path=os.path.join(work_dir, "plan.log"),
        )

        print(f"Plan stored in {plan_file}")

    # Detect files to be modified
    if not args.nolist:
        print("Detecting files to be modified")
        run_navie_command(
            command=appmap_command,
            context_path=plan_file,
            output_path=os.path.join(work_dir, "files.json"),
            log_path=os.path.join(work_dir, "list-files.log"),
            additional_args="@list-files /format=json /nofence",
        )

        print(f"Files to be modified stored in {os.path.join(work_dir, 'files.json')}")

    solution_file = os.path.join(work_dir, "solution.md")

    if not args.nogenerate:
        context_file = os.path.join(work_dir, "context.txt")
        if os.path.exists(context_file):
            os.remove(context_file)
        with open(context_file, "w") as _:
            pass

        with open(os.path.join(work_dir, "files.json")) as f:
            files = json.load(f)

        with open(context_file, "a") as context_f:
            for file in files:
                print("Collecting source file", file)
                context_f.write("<file>\n")
                context_f.write(f"<path>{file}</path>\n")
                context_f.write("<content>\n")
                with open(file, "r") as file_content:
                    context_f.write(file_content.read())
                context_f.write("</content>\n")
                context_f.write("</file>\n")

        plan_prompt = os.path.join(work_dir, "plan.txt")
        with open(plan_prompt, "w") as plan_f:
            plan_f.write(
                """@generate /nocontext /noformat

## Input format

The plan is delineated by the XML <plan> tag.

The source files are delineated by XML <file> tags. Each file has a <path> tag with the file path and a <content> tag with the file content.

Do not treat the XML tags as part of the source code. They are only there to help you parse the context.

## Guidelines

Try to solve the problem with a minimal set of code changes.

Avoid refactorings that will affect multiple parts of the codebase.

## Output format

For each change you want to make, generate a pair of tags called <original> and <modified>.
Wrap these tags with a <change> tag that also includes a <file> tag with the file path.

The <original> tag should contain the original code that you want to change. Do not abbreviate
existing code using ellipses or similar. 

The <original> code should be at least 5 lines long.

Do not output the entire original code if you only want to change a part of it. Output
only the part that you want to change.

The <modified> tag should contain the modified code that you want to replace the original code with.
Do not abbreviate the modified code using ellipses or similar. You must place the exact modified code
in the <modified> tag.

You do not need to output the entire modified code if you only want to change a part of it. Output
only the part that you want to change.

Both the original code and the output code must contain the proper indentation and formatting.
For example, if the original code has 4 spaces of indentation, the output code must also have 4
spaces of indentation. If the original code has 8 spaces of indentation, the output code must also have
8 spaces of indentation.

The <original> and <modified> content should be wrapped in a CDATA section to avoid XML parsing issues.

## Example output

<change>
    <file>sympy/physics/vector/point.py</file>
    <original><![CDATA[
                except Exception:
                    raise ValueError('Velocity of point ' + self.name + ' has not been'
                                    ' defined in ReferenceFrame ' + frame.name)
    ]]></original>
    <modified><![CDATA[
                    # Attempt to calculate the velocity based on position's time derivative
                    return self.pos_from(self).dt(frame)
                except Exception:
                    raise ValueError('Velocity of point ' + self.name + ' has not been'
                                    ' defined in ReferenceFrame ' + frame.name)
    ]]></modified>
</change>
"""
            )

            plan_f.write("<plan>\n")
            with open(plan_file, "r") as plan_content:
                plan_f.write(plan_content.read())
            plan_f.write("</plan>\n")
            with open(context_file, "r") as context_content:
                plan_f.write(context_content.read())

        print("Solving plan", plan_prompt, "into code")

        run_navie_command(
            command=appmap_command,
            input_path=plan_prompt,
            output_path=solution_file,
            log_path=os.path.join(work_dir, "generate.log"),
        )

        print(f"Code generated in {os.path.join(work_dir, 'solution.md')}")

    # Apply the generated code changes
    if not args.noapply:
        apply_prompt = os.path.join(work_dir, "apply.txt")
        with open(apply_prompt, "w") as apply_f:
            apply_f.write("@apply /all\n\n")
            with open(solution_file, "r") as sol_f:
                apply_f.write(sol_f.read())

        print("Applying changes to source files")
        run_navie_command(
            command=appmap_command,
            input_path=apply_prompt,
            output_path=os.path.join(work_dir, "apply.log"),
            log_path=os.path.join(work_dir, "apply.log"),
        )

        print("Changes applied")

    if args.lint_command:
        lint_command = args.lint_command
        lint_error_pattern = args.lint_error_pattern

        print("Linting source files")

        with open(os.path.join(work_dir, "files.json")) as f:
            files = json.load(f)

            for file in files:
                print(f"Linting {file}")
                lint_args = lint_command.split() + [file]

                lint_result = subprocess.run(
                    lint_args,
                    capture_output=True,
                    text=True,
                )

                lint_output = lint_result.stdout + lint_result.stderr

                print(lint_output)

                # If lint_error_pattern starts and ends with '/', treat it as a regular expression.
                # Otherwise, treat it as a string literal.

                lint_error_match = None
                if lint_error_pattern:
                    if lint_error_pattern.startswith("/") and lint_error_pattern.endswith("/"):
                        lint_error_match = re.search(lint_error_pattern[1:-1], lint_output)
                    else:
                        lint_error_match = lint_error_pattern in lint_output

                if lint_error_match:
                    print("The source file contains linting errors.")
                    print(lint_output)

                    norm_file = file.replace("/", "_")

                    repair_prompt, repair_plan, repair_log = [
                        os.path.join(work_dir, f"repair_{norm_file}.{ext}")
                        for ext in ["txt", "md", "log"]
                    ]

                    with open(repair_prompt, "w") as f:
                        f.write(
                            """
@generate /nocontext /noformat

Fix the linter errors indicated by the <lint-error> tag.

## Output format

For each change you want to make, generate a pair of tags called <original> and <modified>. 
Wrap these tags with a <change> tag that also includes a <file> tag with the file path.

The <original> tag should contain the original code that you want to change. Do not abbreviate
existing code using ellipses or similar. 

The <original> code should be at least 5 lines long.

Do not output the entire original code if you only want to change a part of it. Output
only the part that you want to change.

The <modified> tag should contain the modified code that you want to replace the original code with.
Do not abbreviate the modified code using ellipses or similar. You must place the exact modified code
in the <modified> tag.

You do not need to output the entire modified code if you only want to change a part of it. Output
only the part that you want to change.

Both the original code and the output code must contain the proper indentation and formatting. For example, 
if the original code has 4 spaces of indentation, the output code must also have 4 spaces of indentation.
If the original code has 8 spaces of indentation, the output code must also have 8 spaces of indentation.

The <original> and <modified> content should be wrapped in a CDATA section to avoid XML parsing issues.

## Example output

<change>
<file>sympy/physics/vector/point.py</file>
<original><![CDATA[
except Exception:
raise ValueError('Velocity of point ' + self.name + ' has not been defined in ReferenceFrame ' + frame.name)
]]></original>
<modified><![CDATA[
# Attempt to calculate the velocity based on position's time derivative
return self.pos_from(self).dt(frame)
except Exception:
raise ValueError('Velocity of point ' + self.name + ' has not been defined in ReferenceFrame ' + frame.name)
]]></modified>
</change>

<lint-error>
"""
                        )
                        f.write(lint_output)
                        f.write(
                            """
    </lint-error>
    <file>
        <path>"""
                        )
                        f.write(file)
                        f.write(
                            """
        </path>
        <content>
    """
                        )
                        with open(file, "r") as file_fp:
                            f.write(file_fp.read())
                        f.write(
                            """
        </content>
    </file>
    """
                        )

                    # Plan the repair
                    print(f"Generating code to repair {file}")
                    run_navie_command(
                        command=appmap_command,
                        input_path=repair_prompt,
                        output_path=repair_plan,
                        log_path=repair_log,
                    )

                    print(f"Code generated to repair source file in {repair_plan}")

                    repair_apply_prompt = os.path.join(
                        work_dir, f"repair_apply_{norm_file}.txt"
                    )
                    repair_apply_log = os.path.join(
                        work_dir, f"repair_apply_{norm_file}.log"
                    )

                    with open(repair_apply_prompt, "w") as f:
                        f.write("@apply /all\n\n")
                        with open(repair_plan, "r") as plan_fp:
                            f.write(plan_fp.read())

                    print("Applying changes to source files")
                    run_navie_command(
                        command=appmap_command,
                        input_path=repair_apply_prompt,
                        output_path=repair_apply_log,
                        log_path=repair_apply_log,
                    )

                    print("Changes applied")


if __name__ == "__main__":
    main()
