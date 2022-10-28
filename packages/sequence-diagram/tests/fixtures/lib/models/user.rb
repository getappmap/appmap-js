require_relative '../database/db'
require_relative './post'

class User
  attr_reader :id, :login
  attr_writer :posts

  def initialize(id, login)
    @id = id
    @login = login
  end

  def to_h
    { id: id, login: login }
  end

  def posts
    @posts ||= Post.find_for_user(self.id)
  end

  class << self
    # @label mvc.model
    def find(id, prefetch_posts: false, must: true)
      Database.query "User {id = #{id}}"
      user = USERS[id]
      raise "User #{id} not found" unless user || !must

      user.posts = Post.find_for_user(user.id) if prefetch_posts
      user
    end

    def list(ids, prefetch_posts: false, must: true)
      Database.query "Users {id IN #{ids.join(', ')}}"
      users = ids.map { |id| USERS[id] }.compact
      if prefetch_posts
        Post.find_for_users(users.map(&:id)).each do |user_id, posts|
          users.find { |user| user.id == user_id }.posts = posts
        end
      end
      users
    end
  end
end

USERS = {
  '1' => User.new('1', 'alice'),
  '2' => User.new('2', 'bob'),
  '3' => User.new('3', 'charles'),
  '4' => User.new('4', 'dan'),
  '5' => User.new('5', 'ed'),
}
