module Crypt
  class Command
    # @label command
    def self.encrypt_aes_128_cbc
      data = "Very, very confidential data"
      cipher = OpenSSL::Cipher.new('aes-128-cbc')
      cipher.encrypt
      key = cipher.random_key
      iv = cipher.random_iv

      encrypted = cipher.update(data) + cipher.final
    end

    # @label command
    def self.encrypt_aes_256_gcm(record_id)
      data = "Very, very confidential data"
      cipher = OpenSSL::Cipher.new('aes-256-gcm')
      cipher.encrypt
      key = cipher.random_key
      iv = cipher.random_iv
      cipher.auth_data = record_id.to_s

      encrypted = cipher.update(data) + cipher.final
      tag = cipher.auth_tag
      encrypted
    end
  end
end

if $PROGRAM_NAME == __FILE__
  puts Crypt::Command.encrypt_aes_128_cbc
end
