require 'minitest/autorun'
require 'appmap/minitest'
require_relative '../lib/crypt/command'

class CryptTest < Minitest::Test
  def test_crypt_aes_128_cbc
    ciphertext = Crypt::Command.encrypt_aes_128_cbc
    assert_equal 32, ciphertext.length
  end

  def test_crypt_aes_256_gcm
    ciphertext = Crypt::Command.encrypt_aes_256_gcm('test_crypt_aes_256_gcm')
    assert_equal 28, ciphertext.length
  end

  def test_hard_coded_key
    key = Base64.decode64 "f9hmz/Sh93xIdpfiU7ja385+1QtLf5GVX4MaJwjqh0E="
    ciphertext = Crypt::Command.encrypt_aes_256_gcm('test_hard_coded_key', key: key)
    assert_equal 28, ciphertext.length
  end

  def test_random_key
    key = OpenSSL::Random.random_bytes(32)
    ciphertext = Crypt::Command.encrypt_aes_256_gcm('test_hard_coded_key', key: key)
    assert_equal 28, ciphertext.length
  end
end
