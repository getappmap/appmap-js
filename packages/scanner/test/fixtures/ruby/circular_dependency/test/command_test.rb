require 'minitest/autorun'
require 'appmap/minitest'
require_relative '../lib/command/command'

class CommandTest < Minitest::Test
  def test_command
    assert_equal Command.invoke, 'cycle encountered'
  end
end
