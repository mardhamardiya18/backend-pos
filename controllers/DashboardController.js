// Import express
const express = require("express");

// Import prisma client
const prisma = require("../prisma/client");

// Import library untuk manipulasi tanggal
const { subDays, format } = require("date-fns");

const getDashboardData = async (req, res) => {
  try {
    // Mendapatkan tanggal hari ini
    const today = new Date();

    // Menghitung tanggal satu minggu yang lalu
    const week = subDays(today, 7);

    // Mengambil data penjualan dalam 7 hari terakhir dan mengelompokkan berdasarkan tanggal
    const chartSalesWeek = await prisma.transaction.groupBy({
      by: ["created_at"], // Mengelompokkan berdasarkan tanggal pembuatan
      _sum: {
        grand_total: true, // Menjumlahkan total penjualan
      },
      where: {
        created_at: {
          gte: week, // Hanya mengambil data dari 7 hari terakhir
        },
      },
    });

    // Inisialisasi array untuk menyimpan tanggal dan total penjualan
    let sales_date = [];
    let sales_total = [];

    // Menghitung total penjualan selama 7 hari terakhir
    let sumSalesWeek = 0;

    // Memproses data penjualan
    if (chartSalesWeek.length > 0) {
      chartSalesWeek.forEach((result) => {
        sales_date.push(format(new Date(result.created_at), "yyyy-MM-dd"));
        const total = parseInt(result._sum.grand_total || 0);
        sales_total.push(total);
        sumSalesWeek += total;
      });
    } else {
      sales_date.push("");
      sales_total.push(0);
    }

    // Mengambil data keuntungan dalam 7 hari terakhir dan mengelompokkan berdasarkan tanggal
    const chartProfitsWeek = await prisma.profit.groupBy({
      by: ["created_at"], // Mengelompokkan berdasarkan tanggal pembuatan
      _sum: {
        total: true, // Menjumlahkan total keuntungan
      },
      where: {
        created_at: {
          gte: week, // Hanya mengambil data dari 7 hari terakhir
        },
      },
    });

    // Inisialisasi array untuk menyimpan tanggal dan total keuntungan
    let profits_date = [];
    let profits_total = [];

    // Menghitung total keuntungan selama 7 hari terakhir
    let sumProfitsWeek = 0;

    // Memproses data keuntungan
    if (chartProfitsWeek.length > 0) {
      chartProfitsWeek.forEach((result) => {
        profits_date.push(format(new Date(result.created_at), "yyyy-MM-dd"));
        const total = parseInt(result._sum.total || 0);
        profits_total.push(total);
        sumProfitsWeek += total;
      });
    } else {
      profits_date.push("");
      profits_total.push(0);
    }

    // Menghitung jumlah transaksi pada hari ini
    const countSalesToday = await prisma.transaction.count({
      where: {
        created_at: {
          gte: new Date(`${today.toISOString().split("T")[0]}T00:00:00.000Z`), // Mulai dari jam 00:00 hari ini
          lte: new Date(`${today.toISOString().split("T")[0]}T23:59:59.999Z`), // Sampai jam 23:59 hari ini
        },
      },
    });

    // Menjumlahkan total penjualan pada hari ini
    const sumSalesToday = await prisma.transaction.aggregate({
      _sum: {
        grand_total: true, // Menjumlahkan total grand_total
      },
      where: {
        created_at: {
          gte: new Date(`${today.toISOString().split("T")[0]}T00:00:00.000Z`),
          lte: new Date(`${today.toISOString().split("T")[0]}T23:59:59.999Z`),
        },
      },
    });

    // Menjumlahkan total keuntungan pada hari ini
    const sumProfitsToday = await prisma.profit.aggregate({
      _sum: {
        total: true, // Menjumlahkan total keuntungan
      },
      where: {
        created_at: {
          gte: new Date(`${today.toISOString().split("T")[0]}T00:00:00.000Z`),
          lte: new Date(`${today.toISOString().split("T")[0]}T23:59:59.999Z`),
        },
      },
    });

    // Mengambil produk yang stoknya kurang dari atau sama dengan 10
    const productsLimitStock = await prisma.product.findMany({
      where: {
        stock: {
          lte: 10, // Produk dengan stok kurang dari atau sama dengan 10
        },
      },
      include: {
        category: true, // Sertakan data kategori produk
      },
    });

    // Mengambil 5 produk terlaris berdasarkan jumlah transaksi
    const chartBestProducts = await prisma.transactionDetail.groupBy({
      by: ["product_id"], // Mengelompokkan berdasarkan ID produk
      _sum: {
        qty: true, // Menjumlahkan total kuantitas
      },
      orderBy: {
        _sum: {
          qty: "desc", // Mengurutkan berdasarkan kuantitas tertinggi
        },
      },
      take: 5, // Ambil 5 produk teratas
    });

    // Mengambil ID produk yang terlaris
    const productIds = chartBestProducts.map((item) => item.product_id);

    // Mengambil detail produk berdasarkan ID yang sudah didapat
    const products = await prisma.product.findMany({
      where: {
        id: { in: productIds }, // Hanya ambil produk dengan ID yang termasuk dalam productIds
      },
      select: {
        id: true,
        title: true, // Hanya ambil ID dan judul produk
      },
    });

    // Menggabungkan data produk terlaris dengan judul produk
    const bestSellingProducts = chartBestProducts.map((item) => {
      const product = products.find((p) => p.id === item.product_id);
      return {
        title: product?.title || "Unknown Product", // Jika produk tidak ditemukan, beri judul 'Unknown Product'
        total: item._sum.qty || 0, // Total kuantitas produk terjual
      };
    });

    // Mengirimkan response dengan data dashboard
    res.status(200).json({
      meta: {
        success: true,
        message: "Data dashboard berhasil diambil",
      },
      data: {
        count_sales_today: countSalesToday,
        sum_sales_today: sumSalesToday._sum.grand_total || 0,
        sum_sales_week: sumSalesWeek || 0,
        sum_profits_today: sumProfitsToday._sum.total || 0,
        sum_profits_week: sumProfitsWeek || 0,
        sales: {
          sales_date,
          sales_total,
        },
        profits: {
          profits_date,
          profits_total,
        },
        products_limit_stock: productsLimitStock,
        best_selling_products: bestSellingProducts,
      },
    });
  } catch (error) {
    // Mengirimkan response jika terjadi error
    res.status(500).json({
      meta: {
        success: false,
        message: "Internal server error",
      },
      errors: error.message,
    });
  }
};

// Ekspor fungsi getDashboardData untuk digunakan di modul lain
module.exports = {
  getDashboardData,
};
