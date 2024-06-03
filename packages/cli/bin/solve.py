#!/usr/bin/env python3

import argparse
import os
import re
import subprocess
import sys
import json

format_instructions = """For each change you want to make, generate a pair of tags called <original> and <modified>.
Wrap these tags with a <change> tag that also includes a <file> tag with the file path.

The <original> tag should contain the original code that you want to change. Do not abbreviate
existing code using ellipses or similar.

Always include an attribute "no-ellipsis" with the value "true" in the <original> tag.
This should be a true statement about the tag.

The <original> code should contain an attribute that indicates about how many lines of context
it contains. You should plan for this context to contain the code that should be modified, plus
three lines before and after it.

Do not output the entire original code, or long functions, if you only want to change a part of it.
Plan to output only the part that you want to change.

If you need to make multiple changes to the same file, output multiple <change> tags.
In the change, indicate the number of the change that this is, starting from 1.

The <modified> tag should contain the modified code that you want to replace the original code with.
Do not abbreviate the modified code using ellipses or similar. You must place the exact modified code
in the <modified> tag.

You do not need to output the entire modified code if you only want to change a part of it. Output
only the part that you want to change.

Always include an attribute "no-ellipsis" with the value "true" in the <modified> tag.
This should be a true statement about the tag.

Both the original code and the output code must contain the proper indentation and formatting.
For example, if the original code has 4 spaces of indentation, the output code must also have 4
spaces of indentation. If the original code has 8 spaces of indentation, the output code must also have
8 spaces of indentation.

The <original> and <modified> content should be wrapped in a CDATA section to avoid XML parsing issues.

## Example output

<change>
    <file change-number-for-this-file="1">src/main/java/org/springframework/samples/petclinic/vet/Vet.java</file>
    <original line-count="13" no-ellipsis="true"><![CDATA[
    @JoinTable(
        name = "vet_specialties",
        joinColumns = @JoinColumn(name = "vet_id"),
        inverseJoinColumns = @JoinColumn(name = "specialty_id")
    )
    private Set<Specialty> specialties;

    protected Set<Specialty> getSpecialtiesInternal() {
        if (this.specialties == null) {
            this.specialties = new HashSet<>();
        }
        return this.specialties;
    }]]></original>
    <modified no-ellipsis="true"><![CDATA[
    @JoinTable(
        name = "vet_specialties",
        joinColumns = @JoinColumn(name = "vet_id"),
        inverseJoinColumns = @JoinColumn(name = "specialty_id")
    )
    private Set<Specialty> specialties;

    private String address;

    protected Set<Specialty> getSpecialtiesInternal() {
        if (this.specialties == null) {
            this.specialties = new HashSet<>();
        }
        return this.specialties;
    }]]></modified>
</change>
"""


def run_command(command, fail_on_error=True):
    print(f"Executing command: {command}")

    result = subprocess.run(command, shell=True, capture_output=True)
    if result.returncode != 0 and fail_on_error:
        raise RuntimeError(f"Failed to execute command {command}")

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
    # TODO: Add token limit option, e.g. --ai-option tokenLimit=4000
    if input_path:
        cmd += f" -i {input_path}"
    if context_path:
        cmd += f" -c {context_path}"
    cmd += f" -o {output_path}"
    if additional_args:
        cmd += f" {additional_args}"
    cmd += f" > {log_path} 2>&1"

    print(f"Executing command: {cmd}")

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

    # Option to auto-format files before generating the plan.
    parser.add_argument(
        "--format-command", type=str, help="format command to use", default=None
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
    solution_file = os.path.join(work_dir, "solution.md")
    apply_file = os.path.join(work_dir, "apply.md")
    files = []

    if not args.noplan:
        print(f"Generating a plan for {args.issue_file}")

        plan_prompt = os.path.join(work_dir, "plan.txt")
        with open(plan_prompt, "w") as plan_f:
            plan_f.write(
                """@plan

## Guidelines

* Try to solve the problem with a minimal set of code changes.

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

        print(f"Stripping code blocks from {plan_file}")
        # Load the plan file and strip code blocks that are delimeted by ```
        with open(plan_file, "r") as f:
            plan_content = f.read()
        original_plan_content = plan_content
        plan_content = re.sub(r"```.*?```", "", plan_content, flags=re.DOTALL)
        # Diff the original and stripped content
        if original_plan_content != plan_content:
            with open(plan_file, "w") as f:
                f.write(plan_content)
            print("Code blocks stripped")

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

    with open(os.path.join(work_dir, "files.json")) as f:
        files = json.load(f)

    if not args.nogenerate:
        context_file = os.path.join(work_dir, "context.txt")
        with open(context_file, "w") as context_f:
            for file in files:
                print("Collecting source file", file)
                context_f.write("<file>\n")
                context_f.write(f"<path>{file}</path>\n")
                context_f.write("<content>\n")
                if os.path.isfile(file):
                    if args.format_command:
                        print(f"Auto-formatting file {file}")
                        format_command = args.format_command.split() + [file]
                        run_command(" ".join(format_command))

                    with open(file, "r") as content_f:
                        file_content = content_f.read()
                        file_lines = file_content.split("\n")
                        any_line_starts_with_tabs = any(
                            line.startswith("\t") for line in file_lines
                        )
                        if any_line_starts_with_tabs:
                            print(
                                f"Warning: File '{file}' starts with tabs. Code generation is not likely to be reliable. Please replace identation with spaces, or specify the --format-command option to have it done automatically.",
                                file=sys.stderr,
                            )

                        context_f.write(file_content)
                else:
                    print(
                        f"Notice: File '{file}' does not exist. It will probably be created in the code generation step.",
                        file=sys.stderr,
                    )
                context_f.write("</content>\n")
                context_f.write("</file>\n")

        generate_prompt = os.path.join(work_dir, "generate.txt")
        with open(generate_prompt, "w") as generate_f:
            generate_f.write(
                f"""@generate /nocontext /noformat

## Input format

The plan is delineated by the XML <plan> tag.

The source files are delineated by XML <file> tags. Each file has a <path> tag with the file path and a <content> tag with the file content.

Do not treat the XML tags as part of the source code. They are only there to help you parse the context.

## Guidelines

Try to solve the problem with a minimal set of code changes.

Avoid refactorings that will affect multiple parts of the codebase.

## Output format

{format_instructions}

"""
            )

            generate_f.write("<plan>\n")
            with open(plan_file, "r") as plan_content:
                generate_f.write(plan_content.read())
            generate_f.write("</plan>\n")
            with open(context_file, "r") as context_content:
                generate_f.write(context_content.read())

        print("Solving plan", generate_prompt, "into code")

        run_navie_command(
            command=appmap_command,
            input_path=generate_prompt,
            output_path=solution_file,
            log_path=os.path.join(work_dir, "generate.log"),
        )

        print(f"Code generated in {solution_file}")

    # Store the original content of the files
    base_file_content = {}
    for file in files:
        with open(file, "r") as f:
            base_file_content[file] = f.read()

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
            output_path=apply_file,
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
                norm_file = file.replace("/", "_")

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
                #
                # Find all lint errors reported in the output. Then select just those errors that
                # are reported on lines that we have modified.
                lint_errors = []
                if lint_error_pattern:
                    if lint_error_pattern.startswith(
                        "/"
                    ) and lint_error_pattern.endswith("/"):
                        lint_errors = re.findall(lint_error_pattern[1:-1], lint_output)
                    else:
                        lint_errors = lint_output.split("\n").filter(
                            lambda line: lint_error_pattern in line
                        )
                else:
                    lint_errors = lint_output.split("\n")

                temp_dir = os.path.join(work_dir, "diff", norm_file)
                os.makedirs(temp_dir, exist_ok=True)
                # Write the base file content
                with open(os.path.join(temp_dir, "base"), "w") as f:
                    f.write(base_file_content[file])
                with open(file, "r") as f:
                    with open(os.path.join(temp_dir, "updated"), "w") as f2:
                        f2.write(f.read())
                # Run the diff command
                diff_command = f"diff -u {os.path.join(temp_dir, 'base')} {os.path.join(temp_dir, 'updated')}"
                file_diff = run_command(diff_command, fail_on_error=False)

                print(file_diff)

                # Lint errors are formatted like this:
                # bin/solve.py:257:80: E501 line too long (231 > 79 characters)
                # Collect the line numbers of the lint errors.
                lint_errors_by_line_number = {}
                for error in lint_errors:
                    if error:
                        line_number = error.split(":")[1]
                        print(f"Error reported on line {line_number}: ${error}")
                        lint_errors_by_line_number[int(line_number)] = error

                # The file diff contains chunks like:
                # @@ -147,15 +147,21 @@
                # Find the '+' number, which indicates the start line. Also find the number after the
                # comma, which indicates the number of lines. Report these two numbers for each chunk.
                diff_ranges = [
                    [int(ch) for ch in chunk.split(" ")[2].split(",")]
                    for chunk in file_diff.split("\n")
                    if chunk.startswith("@@")
                ]

                for diff_range in diff_ranges:
                    print(
                        f"The file has changes between lines {diff_range[0]} and {diff_range[0] + diff_range[1]}"
                    )

                lint_error_line_numbers_within_diff_sections = [
                    line_number
                    for line_number in lint_errors_by_line_number.keys()
                    for diff_range in diff_ranges
                    if diff_range[0] <= line_number <= diff_range[0] + diff_range[1]
                ]

                if lint_error_line_numbers_within_diff_sections:
                    print(
                        f"Lint errors within diff sections: {lint_error_line_numbers_within_diff_sections}"
                    )
                else:
                    print("There are no lint errors within diff sections")

                for line_number in lint_error_line_numbers_within_diff_sections:
                    lint_error = lint_errors_by_line_number[line_number]
                    print(f"Error reported on line {line_number}: {lint_error}")

                    # Extract the chunk of code that contains the error
                    content_chunk_lines = []
                    with open(file, "r") as f:
                        lines = f.readlines()

                        # # Mark the line with the error
                        # error_line = lines[line_number - 1]

                        # # Detect line ending as \n or \r\n
                        # line_ending_regexp = re.compile(r"\r?\n")
                        # line_ending = line_ending_regexp.search(error_line).group(0)
                        # line = lines[line_number - 1].rstrip()

                        # lines[line_number - 1] = f"{line} <- {lint_error}{line_ending}"

                        range_min = max(0, line_number - 3)
                        range_max = min(len(lines), line_number + 3)
                        for line_number in range(range_min, range_max):
                            content_chunk_lines.append(f"{line_number + 1}: {lines[line_number]}")

                        # for i in range(
                        #     max(0, line_number - 3), min(len(lines), line_number + 3)
                        # ):
                        #     content_chunk_lines.append(lines[i])

                    repair_dir = os.path.join(
                        work_dir, "repair", norm_file, str(line_number)
                    )
                    os.makedirs(repair_dir, exist_ok=True)

                    repair_prompt, repair_output, repair_log = [
                        os.path.join(repair_dir, f"generate.{ext}")
                        for ext in ["txt", "md", "log"]
                    ]
                    repair_apply_prompt, repair_apply_output, repair_apply_log = [
                        os.path.join(repair_dir, f"apply.{ext}")
                        for ext in ["txt", "md", "log"]
                    ]

                    with open(repair_prompt, "w") as f:
                        f.write(
                            f"""
@generate /nocontext /noformat

Fix the linter errors indicated by the <lint-error> tag.

## Output format

{format_instructions}

In the <original> and <modified> tags, do not emit line numbers. The line numbers are
only present in the file/content to help you identify which line has the lint error.

## Error report

<lint-error>
"""
                        )
                        f.write(lint_error)
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
                        f.write("".join(content_chunk_lines))
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
                        output_path=repair_output,
                        log_path=repair_log,
                    )

                    print(f"Code generated to repair source file in {repair_output}")

                    with open(repair_apply_prompt, "w") as f:
                        f.write("@apply /all\n\n")
                        with open(repair_output, "r") as plan_fp:
                            f.write(plan_fp.read())

                    print("Applying changes to source files")
                    run_navie_command(
                        command=appmap_command,
                        input_path=repair_apply_prompt,
                        output_path=repair_apply_output,
                        log_path=repair_apply_log,
                    )

                    print("Changes applied")


if __name__ == "__main__":
    main()
