module Views
  module Posts
    class Show
      attr_reader :post

      def initialize(post)
        @post = post
      end

      def show
        post.text
      end
    end
  end
end
