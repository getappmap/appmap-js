require 'minitest/autorun'
require 'appmap/minitest'
require_relative '../lib/circular/command'

class CircularTest < Minitest::Test
  def test_cycle
    assert_equal Circular::Command.invoke, 'cycle encountered'
  end
end
