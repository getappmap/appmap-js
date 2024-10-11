fun main(args: Array<String>) {
    println(args.contentToString())
}

class Rectangle(val height: Double, val length: Double) {
    val perimeter = (height + length) * 2
}

typealias Predicate<T> = (T) -> Boolean

enum class Color(val value: Int) {
    RED(1),
    GREEN(2),
    BLUE(3)
}

fun <T> List<T>.filter(predicate: Predicate<T>): List<T> {
    return this.filter(predicate)
}

fun <T: Comparable<T>> sort(list: List<T>): List<T> {
    return list.sorted()
}
