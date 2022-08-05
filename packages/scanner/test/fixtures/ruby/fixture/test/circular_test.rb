require_relative './test_helper'
require_relative '../lib/circular/command'

class CircularTest < Minitest::Test
  def test_cycle
    assert_equal Circular::Command.invoke, 'cycle encountered'
  end
end
