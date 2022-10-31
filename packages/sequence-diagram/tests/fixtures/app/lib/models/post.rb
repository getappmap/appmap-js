require_relative '../database/db'

class Post
  attr_reader :id, :user_id, :text

  def initialize(id, user_id, text)
    @id = id
    @user_id = user_id
    @text = text
  end

  def to_h
    { id: id, user_id: user_id, text: text }
  end

  class << self
    # @label mvc.model
    def find_for_user(user_id)
      Database.query "Posts {user = #{user_id}}"
      POSTS[user_id] || []
    end

    # @label mvc.model
    def find_for_users(user_ids)
      Database.query "Posts {user IN #{user_ids.join(', ')}}"

      user_ids.each_with_object({}) {|user_id, memo| memo[user_id] = POSTS[user_id] || []}
    end
  end
end

POSTS = {
  '1' => [ Post.new('10', '1', 'first post'), Post.new('11', '1', 'second post') ],
  '2' => [ Post.new('20', '2', 'first post'), Post.new('21', '2', 'second post') ],
  '3' => [ Post.new('30', '3', 'first post'), Post.new('31', '3', 'second post'), Post.new('32', '3', 'third post') ],
  '4' => [ Post.new('40', '4', 'first post'), Post.new('41', '4', 'second post') ],
  '5' => [ Post.new('50', '5', 'first post'), Post.new('51', '5', 'second post') ],
}
