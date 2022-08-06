require_relative './test_helper'
require_relative '../lib/eval/command'

class EvalTest < Minitest::Test
  def test_eval_unsafe
    Eval::Command.eval_code "puts 'Hello world'"
  end

  def test_eval_safe
    Eval::Command.safe_eval_code "puts 'Hello world'"
  end

  def test_eval_sanitized
    Eval::Command.sanitize_eval_code Eval::Command::SAFE_CODE_STR
  end
end
