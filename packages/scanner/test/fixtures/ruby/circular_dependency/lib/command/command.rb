require_relative '../pkg_a/a'

class Command
  # @label command
  def self.invoke
    PkgA::A.new.invoke
  end
end

if $PROGRAM_NAME == __FILE__
  puts ::Command.invoke
end
