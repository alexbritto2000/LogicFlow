using LogiTrack.Domain.Entities;
using LogiTrack.Domain.Enums;

namespace LogiTrack.Tests;

public class InvoiceAndPaymentCalculationTests
{
    [Fact]
    public void Invoice_Balance_ShouldEqualTotalMinusPaidAmount()
    {
        // Arrange
        var invoice = new Invoice
        {
            InvoiceNumber = "INV-2026-000001",
            SubTotal = 10000m,
            Tax = 1800m, // 18% GST
            Discount = 500m,
            Total = 11300m,
            PaidAmount = 5000m
        };

        // Assert
        Assert.Equal(6300m, invoice.Balance);
    }

    [Fact]
    public void Invoice_WhenFullyPaid_BalanceShouldBeZero()
    {
        // Arrange
        var invoice = new Invoice
        {
            InvoiceNumber = "INV-2026-000002",
            SubTotal = 50000m,
            Tax = 9000m,
            Discount = 0m,
            Total = 59000m,
            PaidAmount = 59000m
        };

        // Assert
        Assert.Equal(0m, invoice.Balance);
    }

    [Fact]
    public void InvoiceItem_Amount_ShouldEqualQuantityTimesUnitPrice()
    {
        // Arrange
        var item = new InvoiceItem
        {
            Description = "Full Truckload Mumbai to Pune",
            Quantity = 4,
            UnitPrice = 12500m
        };

        // Assert
        Assert.Equal(50000m, item.Amount);
    }
}
