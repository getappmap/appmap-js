module Eval
  class Command
    SAFE_CODE_STR = "puts 'Hello, I am safe!'"

    # @label command
    def self.eval_code(code_str)
      eval code_str
    end

    # @label command lang.eval.safe
    def self.safe_eval_code(code_str)
      eval code_str
    end

    # @label command
    def self.sanitize_eval_code(code_str)
      eval self.sanitize(code_str)
    end

    # @label lang.eval.sanitize
    def self.sanitize(code_str)
      raise "Illegal code string #{code_str}" unless code_str === SAFE_CODE_STR

      code_str
    end
  end
end
