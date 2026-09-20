namespace LogiTrack.Domain.Common;

public interface ISoftDelete
{
    bool IsActive { get; set; }
}
