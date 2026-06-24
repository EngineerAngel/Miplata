resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_support   = true
  enable_dns_hostnames = true
  tags                 = merge(local.common_tags, { Name = "${local.name}-vpc" })
}

resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id
  tags   = merge(local.common_tags, { Name = "${local.name}-igw" })
}

resource "aws_subnet" "public" {
  for_each = toset(["a", "b"])

  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.${each.value == "a" ? 1 : 2}.0/24"
  availability_zone       = "${var.aws_region}${each.value}"
  map_public_ip_on_launch = true
  tags                    = merge(local.common_tags, { Name = "${local.name}-public-${each.value}" })
}

resource "aws_subnet" "private" {
  for_each = toset(["a", "b"])

  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.${each.value == "a" ? 3 : 4}.0/24"
  availability_zone = "${var.aws_region}${each.value}"
  tags              = merge(local.common_tags, { Name = "${local.name}-private-${each.value}" })
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }
  tags = merge(local.common_tags, { Name = "${local.name}-public-rt" })
}

resource "aws_route_table_association" "public" {
  for_each = aws_subnet.public

  subnet_id      = each.value.id
  route_table_id = aws_route_table.public.id
}
