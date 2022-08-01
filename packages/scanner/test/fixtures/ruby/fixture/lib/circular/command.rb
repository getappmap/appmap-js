require_relative './pkg_a/a'

module Circular
  class Command
    # @label command
    def self.invoke
      PkgA::A.new.invoke
    end
  end
end

if $PROGRAM_NAME == __FILE__
  puts Circular::Command.invoke
end
