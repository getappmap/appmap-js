require_relative '../pkg_a/a'

module PkgB
  class B
    def invoke
      PkgA::A.new.cycle
    end
  end
end
