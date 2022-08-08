require 'minitest/autorun'
require 'appmap/minitest'
require_relative '../lib/crypt/command'

class CryptTest < Minitest::Test
  def test_crypt_aes_128_cbc
    ciphertext = Crypt::Command.encrypt_aes_128_cbc
    assert_equal 32, ciphertext.length
  end

  def test_crypt_aes_256_gcm
    ciphertext = Crypt::Command.encrypt_aes_256_gcm(:record_id)
    assert_equal 28, ciphertext.length
  end
end
