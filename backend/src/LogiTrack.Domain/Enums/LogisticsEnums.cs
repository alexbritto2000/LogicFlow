namespace LogiTrack.Domain.Enums;

public enum VehicleStatus
{
    Available = 1,
    Assigned = 2,
    InTransit = 3,
    Maintenance = 4,
    Inactive = 5
}

public enum DriverStatus
{
    Available = 1,
    Assigned = 2,
    OnLeave = 3,
    Inactive = 4
}

public enum VehicleDocumentType
{
    RC = 1,
    Insurance = 2,
    FitnessCertificate = 3,
    Permit = 4,
    PollutionCertificate = 5,
    Other = 6
}

public enum DriverDocumentType
{
    DrivingLicense = 1,
    MedicalCertificate = 2,
    IdProof = 3,
    Other = 4
}

public enum DocumentExpiryStatus
{
    Valid = 1,
    ExpiringSoon = 2,
    Expired = 3
}

public enum BookingStatus
{
    Draft = 1,
    Confirmed = 2,
    Assigned = 3,
    PickedUp = 4,
    InTransit = 5,
    OutForDelivery = 6,
    Delivered = 7,
    Cancelled = 8
}

public enum ShipmentStatus
{
    Created = 1,
    Assigned = 2,
    PickedUp = 3,
    InTransit = 4,
    OutForDelivery = 5,
    Delivered = 6,
    Cancelled = 7
}

public enum PaymentMethod
{
    Cash = 1,
    UPI = 2,
    BankTransfer = 3,
    Cheque = 4,
    Other = 5
}

public enum PaymentStatus
{
    Pending = 1,
    Partial = 2,
    Paid = 3,
    Failed = 4
}

public enum ExpenseType
{
    Fuel = 1,
    Toll = 2,
    Maintenance = 3,
    DriverAllowance = 4,
    Parking = 5,
    Other = 6
}

public enum InvoiceStatus
{
    Draft = 1,
    Sent = 2,
    PartiallyPaid = 3,
    Paid = 4,
    Overdue = 5
}

public enum NotificationType
{
    Info = 1,
    Warning = 2,
    Alert = 3,
    Success = 4
}
