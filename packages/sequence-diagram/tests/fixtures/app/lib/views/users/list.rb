module Views
  module Users
    class List
      attr_reader :users

      def initialize(users)
        @users = users
      end

      def list
        users.map do |user|
          user.to_h.tap do |data|
            data[:posts] = user.posts.map { |post| Posts::Show.new(post).show }
          end
        end
      end
    end
  end
end
