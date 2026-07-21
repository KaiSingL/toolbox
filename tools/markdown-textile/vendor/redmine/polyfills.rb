class String
  def blank?
    strip.empty?
  end

  def starts_with?(prefix)
    slice(0, prefix.length) == prefix
  end

  def present?
    !blank?
  end
end

class NilClass
  def blank?
    true
  end

  def present?
    false
  end
end