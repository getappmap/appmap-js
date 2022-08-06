require_relative '../pkg_b/b'

module PkgA
  class A
    def invoke
      PkgB::B.new.invoke
    end

    def cycle
      'cycle encountered'
    end
  end
end
